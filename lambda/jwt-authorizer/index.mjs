import { CognitoJwtVerifier } from 'aws-jwt-verify';

const userPoolId = process.env.USER_POOL_ID;
const clientId = process.env.USER_POOL_CLIENT_ID;

if (!userPoolId || !clientId) {
  throw new Error('Missing USER_POOL_ID or USER_POOL_CLIENT_ID environment variables');
}

const accessTokenVerifier = CognitoJwtVerifier.create({
  userPoolId,
  tokenUse: 'access',
  clientId,
});

const idTokenVerifier = CognitoJwtVerifier.create({
  userPoolId,
  tokenUse: 'id',
  clientId,
});

const buildPolicy = (principalId, effect, resource, context = {}) => ({
  principalId,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource,
      },
    ],
  },
  context: Object.entries(context).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }
    acc[key] = String(value);
    return acc;
  }, {}),
});

const extractBearerToken = (event) => {
  const headers = event?.headers || {};
  const headerCandidates = [
    headers.Authorization,
    headers.authorization,
    headers.AUTHORIZATION,
  ].filter(Boolean);

  const authorizationHeader = headerCandidates.find((value) =>
    typeof value === 'string' && value.toLowerCase().startsWith('bearer ')
  );

  if (!authorizationHeader) {
    return null;
  }

  return authorizationHeader.slice(7).trim();
};

const verifyToken = async (token) => {
  try {
    const payload = await accessTokenVerifier.verify(token);
    return { payload, tokenUse: 'access' };
  } catch (accessError) {
    console.warn('[Authorizer] Access token verification failed, trying id token:', accessError.message);
    const payload = await idTokenVerifier.verify(token);
    return { payload, tokenUse: 'id' };
  }
};

export const handler = async (event) => {
  console.log('[Authorizer] Incoming event', {
    methodArn: event?.methodArn,
    path: event?.path,
    headersPresent: !!event?.headers,
  });

  try {
    const token = extractBearerToken(event);
    if (!token) {
      console.error('[Authorizer] Missing bearer token');
      throw new Error('Unauthorized');
    }

    const { payload, tokenUse } = await verifyToken(token);

    const principalId = payload.sub || payload.username || 'unknown-user';
    const policy = buildPolicy(principalId, 'Allow', event.methodArn, {
      sub: payload.sub,
      username: payload.username || payload['cognito:username'],
      email: payload.email,
      scope: payload.scope,
      groups: Array.isArray(payload['cognito:groups'])
        ? payload['cognito:groups'].join(',')
        : undefined,
      token_use: tokenUse,
    });

    console.log('[Authorizer] Token verified successfully', { tokenUse, principalId });

    return policy;
  } catch (error) {
    console.error('[Authorizer] Authorization failed', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    // Lambda authorizers must throw the literal string "Unauthorized" for 401 responses.
    throw 'Unauthorized';
  }
};
