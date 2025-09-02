import { LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import 'winston-daily-rotate-file';
export declare class LoggerService implements NestLoggerService {
    private configService;
    private logger;
    private context?;
    constructor(configService: ConfigService);
    log(message: any, context?: string): void;
    error(message: any, trace?: string, context?: string): void;
    warn(message: any, context?: string): void;
    debug(message: any, context?: string): void;
    verbose(message: any, context?: string): void;
    setContext(context: string): void;
    logHttpRequest(method: string, url: string, statusCode: number, responseTime: number, userId?: string): void;
    logDatabaseQuery(query: string, duration: number, params?: any[]): void;
    logExternalApiCall(service: string, endpoint: string, method: string, statusCode: number, duration: number): void;
    logSecurityEvent(event: string, userId?: string, ip?: string, metadata?: any): void;
    logBusinessEvent(event: string, userId?: string, metadata?: any): void;
    logPerformanceMetric(metric: string, value: number, unit?: string, metadata?: any): void;
    logAzureOpenAICall(operation: string, tokens: number, duration: number, success: boolean): void;
}
//# sourceMappingURL=logger.service.d.ts.map