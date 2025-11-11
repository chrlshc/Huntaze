export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    timestamp: Date;
  };
  metadata?: any;
}

export const createApiResponse = <T>(
  data?: T,
  error?: string,
  metadata?: any
): ApiResponse<T> => {
  return {
    success: !error,
    data,
    error: error
      ? {
          code: 'OPERATION_FAILED',
          message: error,
          timestamp: new Date(),
        }
      : undefined,
    metadata: metadata
      ? {
          requestId: `req_${Date.now()}`,
          timestamp: new Date(),
          processingTime: 0,
          version: '1.0',
          ...metadata,
        }
      : undefined,
  };
};

