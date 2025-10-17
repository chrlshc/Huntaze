import os, json, time, hmac, hashlib, base64
import boto3

region = os.environ.get('AWS_REGION') or os.environ.get('AWS_DEFAULT_REGION') or 'us-east-1'
secrets = boto3.client('secretsmanager', region_name=region)
ecs = boto3.client('ecs', region_name=region)

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')

def b64url_json(obj) -> str:
    return b64url(json.dumps(obj, separators=(',', ':')).encode('utf-8'))

def sign_hs256(secret: str, payload: dict, ttl_seconds: int) -> str:
    now = int(time.time())
    header = { 'alg': 'HS256', 'typ': 'JWT' }
    full_payload = dict(payload)
    full_payload['iat'] = now
    full_payload['exp'] = now + int(ttl_seconds)
    signing_input = f"{b64url_json(header)}.{b64url_json(full_payload)}".encode('utf-8')
    sig = hmac.new(secret.encode('utf-8'), signing_input, hashlib.sha256).digest()
    return signing_input.decode('utf-8') + '.' + b64url(sig)

def lambda_handler(event, context):
    ws_jwt_secret = os.environ.get('WS_JWT_SECRET')
    if not ws_jwt_secret:
        raise Exception('WS_JWT_SECRET missing')
    secret_id = os.environ.get('SECRET_ID', 'onlyfans-ws')
    agent_id = os.environ.get('AGENT_ID', 'huntaze-of-scrap')
    ttl_seconds = int(os.environ.get('TTL_SECONDS', '3600'))
    cluster = os.environ.get('CLUSTER', 'huntaze-cluster')
    service = os.environ.get('SERVICE', 'onlyfans-scraper')

    token = sign_hs256(ws_jwt_secret, { 'agentId': agent_id }, ttl_seconds)

    secrets.put_secret_value(SecretId=secret_id, SecretString=json.dumps({ 'token': token }))

    ecs.update_service(cluster=cluster, service=service, forceNewDeployment=True)

    return { 'status': 'ok', 'rotatedAt': int(time.time()) }

