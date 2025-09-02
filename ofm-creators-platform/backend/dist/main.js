"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("@fastify/helmet"));
const compress_1 = __importDefault(require("@fastify/compress"));
const app_module_1 = require("./app.module");
const prisma_service_1 = require("./infrastructure/database/prisma.service");
const logger_service_1 = require("./core/logger/logger.service");
const http_exception_filter_1 = require("./core/filters/http-exception.filter");
const transform_interceptor_1 = require("./core/interceptors/transform.interceptor");
const logging_interceptor_1 = require("./core/interceptors/logging.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter({
        logger: true,
        trustProxy: true,
        bodyLimit: 10485760, // 10MB
    }));
    const configService = app.get(config_1.ConfigService);
    const logger = app.get(logger_service_1.LoggerService);
    // Security
    await app.register(helmet_1.default, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
    });
    // Compression
    await app.register(compress_1.default, {
        encodings: ['gzip', 'deflate'],
        threshold: 1024,
    });
    // CORS
    app.enableCors({
        origin: configService.get('cors.origin', '*'),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'X-Api-Key',
            'X-Webhook-Signature',
        ],
    });
    // Versioning
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: '1',
    });
    // Global pipes
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    // Global filters
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter(logger));
    // Global interceptors
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(logger), new transform_interceptor_1.TransformInterceptor());
    // Prisma shutdown hook
    const prismaService = app.get(prisma_service_1.PrismaService);
    await prismaService.enableShutdownHooks(app);
    // Swagger documentation
    if (configService.get('app.env') !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Huntaze Platform API')
            .setDescription('API documentation for the Huntaze Platform')
            .setVersion('1.0')
            .addBearerAuth()
            .addApiKey({ type: 'apiKey', name: 'X-Api-Key', in: 'header' })
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
                tagsSorter: 'alpha',
                operationsSorter: 'alpha',
            },
        });
    }
    // Health check
    app.getHttpAdapter().get('/health', (req, reply) => {
        reply.send({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    });
    const port = configService.get('app.port', 3000);
    const host = configService.get('app.host', '0.0.0.0');
    await app.listen(port, host);
    logger.log(`🚀 Application is running on: http://${host}:${port}`);
    logger.log(`📚 API documentation available at: http://${host}:${port}/api/docs`);
}
bootstrap().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map