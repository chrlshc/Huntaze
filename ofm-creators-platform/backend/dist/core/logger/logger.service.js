"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const winston = __importStar(require("winston"));
require("winston-daily-rotate-file");
let LoggerService = class LoggerService {
    configService;
    logger;
    context;
    constructor(configService) {
        this.configService = configService;
        const env = this.configService.get('app.env', 'development');
        const logLevel = this.configService.get('logging.level', 'info');
        // Define log formats
        const logFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.splat(), winston.format.json());
        const consoleFormat = winston.format.combine(winston.format.colorize({ all: true }), winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            const contextStr = context ? `[${context}] ` : '';
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level} ${contextStr}${message}${metaStr}`;
        }));
        // Configure transports
        const transports = [];
        // Console transport
        if (env !== 'production' || this.configService.get('logging.console', true)) {
            transports.push(new winston.transports.Console({
                format: consoleFormat,
                level: logLevel,
            }));
        }
        // File transports with rotation
        if (this.configService.get('logging.file.enabled', true)) {
            const logDir = this.configService.get('logging.file.dir', 'logs');
            // Combined log file
            transports.push(new winston.transports.DailyRotateFile({
                dirname: logDir,
                filename: 'huntaze-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '14d',
                format: logFormat,
                level: logLevel,
            }));
            // Error log file
            transports.push(new winston.transports.DailyRotateFile({
                dirname: logDir,
                filename: 'huntaze-error-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '30d',
                format: logFormat,
                level: 'error',
            }));
        }
        // Create logger instance
        this.logger = winston.createLogger({
            level: logLevel,
            format: logFormat,
            defaultMeta: {
                service: 'huntaze-platform',
                env
            },
            transports,
        });
        // Handle uncaught exceptions and rejections
        if (this.configService.get('logging.handleExceptions', true)) {
            this.logger.exceptions.handle(new winston.transports.File({
                filename: 'logs/exceptions.log',
                format: logFormat
            }));
            this.logger.rejections.handle(new winston.transports.File({
                filename: 'logs/rejections.log',
                format: logFormat
            }));
        }
    }
    log(message, context) {
        this.logger.info(message, { context: context || this.context });
    }
    error(message, trace, context) {
        this.logger.error(message, {
            context: context || this.context,
            trace
        });
    }
    warn(message, context) {
        this.logger.warn(message, { context: context || this.context });
    }
    debug(message, context) {
        this.logger.debug(message, { context: context || this.context });
    }
    verbose(message, context) {
        this.logger.verbose(message, { context: context || this.context });
    }
    setContext(context) {
        this.context = context;
    }
    // Additional custom logging methods
    logHttpRequest(method, url, statusCode, responseTime, userId) {
        this.logger.info('HTTP Request', {
            type: 'http_request',
            method,
            url,
            statusCode,
            responseTime,
            userId,
            context: 'HTTP',
        });
    }
    logDatabaseQuery(query, duration, params) {
        this.logger.debug('Database Query', {
            type: 'db_query',
            query,
            duration,
            params,
            context: 'Database',
        });
    }
    logExternalApiCall(service, endpoint, method, statusCode, duration) {
        this.logger.info('External API Call', {
            type: 'external_api',
            service,
            endpoint,
            method,
            statusCode,
            duration,
            context: 'External API',
        });
    }
    logSecurityEvent(event, userId, ip, metadata) {
        this.logger.warn('Security Event', {
            type: 'security',
            event,
            userId,
            ip,
            metadata,
            context: 'Security',
        });
    }
    logBusinessEvent(event, userId, metadata) {
        this.logger.info('Business Event', {
            type: 'business',
            event,
            userId,
            metadata,
            context: 'Business',
        });
    }
    logPerformanceMetric(metric, value, unit = 'ms', metadata) {
        this.logger.info('Performance Metric', {
            type: 'performance',
            metric,
            value,
            unit,
            metadata,
            context: 'Performance',
        });
    }
    logAzureOpenAICall(operation, tokens, duration, success) {
        this.logger.info('Azure OpenAI API Call', {
            type: 'azure_openai',
            operation,
            tokens,
            duration,
            success,
            context: 'Azure OpenAI',
        });
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LoggerService);
//# sourceMappingURL=logger.service.js.map