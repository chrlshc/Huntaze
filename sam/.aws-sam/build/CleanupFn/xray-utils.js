// X-Ray utilities for canary tracing
const AWSXRay = require('aws-xray-sdk-core');

/**
 * Annotate X-Ray trace with canary metadata
 * Annotations are indexed and searchable in X-Ray console
 * Metadata is for debugging only (not indexed)
 */
function annotateCanaryTrace(isCanary, userId, duration) {
  const segment = AWSXRay.getSegment();
  if (!segment) {
    console.warn('[XRAY] No active segment found');
    return;
  }
  
  try {
    // Annotations (indexed, filterable in X-Ray console)
    segment.addAnnotation('canary', isCanary);
    segment.addAnnotation('path', isCanary ? 'prisma' : 'mock');
    segment.addAnnotation('userId', userId);
    
    // Metadata (non-indexed, for debugging)
    segment.addMetadata('huntaze', {
      timestamp: new Date().toISOString(),
      version: process.env.AWS_LAMBDA_FUNCTION_VERSION || 'unknown',
      duration_ms: duration,
      canaryEnabled: isCanary,
      region: process.env.AWS_REGION || 'unknown'
    });
    
    console.log(`[XRAY] Annotated trace: canary=${isCanary}, userId=${userId}, duration=${duration}ms`);
  } catch (error) {
    console.error('[XRAY] Failed to annotate trace:', error);
  }
}

/**
 * Create a subsegment for shadow traffic
 * Useful for tracking shadow invocations separately
 */
function createShadowSubsegment(name, callback) {
  const segment = AWSXRay.getSegment();
  if (!segment) {
    console.warn('[XRAY] No active segment for subsegment');
    return callback();
  }
  
  const subsegment = segment.addNewSubsegment(name);
  subsegment.addAnnotation('type', 'shadow');
  
  try {
    const result = callback();
    subsegment.close();
    return result;
  } catch (error) {
    subsegment.addError(error);
    subsegment.close();
    throw error;
  }
}

/**
 * Annotate error details for better debugging
 */
function annotateError(error, context = {}) {
  const segment = AWSXRay.getSegment();
  if (!segment) return;
  
  try {
    segment.addError(error);
    segment.addMetadata('error_details', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
    
    console.error('[XRAY] Annotated error:', error.message);
  } catch (err) {
    console.error('[XRAY] Failed to annotate error:', err);
  }
}

module.exports = {
  annotateCanaryTrace,
  createShadowSubsegment,
  annotateError
};
