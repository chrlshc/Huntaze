import AWSXRay from 'aws-xray-sdk-core'

const isProduction = process.env.NODE_ENV === 'production'
const isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)

if (isProduction) {
  try {
    AWSXRay.captureHTTPsGlobal(require('http'))
    AWSXRay.captureHTTPsGlobal(require('https'))
  } catch (error) {
    console.warn('[xray] Failed to capture HTTP modules', error)
  }

  if (isLambda) {
    AWSXRay.enableAutomaticMode()
  }
} else {
  AWSXRay.setContextMissingStrategy('LOG_ERROR')
}

export { AWSXRay }

export function captureAWSv3Client<T>(client: T): T {
  return isProduction ? (AWSXRay.captureAWSv3Client(client) as T) : client
}

export default AWSXRay
