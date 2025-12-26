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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaProcessorService = exports.MediaController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const express_1 = require("express");
const multer_1 = require("multer");
const jwt_auth_guard_1 = require("@/core/guards/jwt-auth.guard");
const media_processor_service_1 = require("../services/media-processor.service");
Object.defineProperty(exports, "MediaProcessorService", { enumerable: true, get: function () { return media_processor_service_1.MediaProcessorService; } });
const audit_log_service_1 = require("@/modules/audit/services/audit-log.service");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let MediaController = class MediaController {
    mediaProcessor;
    auditLog;
    constructor(mediaProcessor, auditLog) {
        this.mediaProcessor = mediaProcessor;
        this.auditLog = auditLog;
    }
    async uploadFile(file, req) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        try {
            // Check for duplicate
            const tempHash = await this.mediaProcessor.generateFileHash(file.path);
            const isDuplicate = await this.mediaProcessor.checkDuplicate(tempHash, req.user.id);
            if (isDuplicate) {
                // Clean up temp file
                fs.unlinkSync(file.path);
                throw new common_1.BadRequestException('This file has already been uploaded');
            }
            // Process media (strip EXIF, add watermark)
            const processed = await this.mediaProcessor.processMedia(file.path, {
                userId: req.user.id,
                sessionId: req.sessionId,
                watermark: req.user.plan !== 'enterprise', // Enterprise users can disable watermark
                watermarkOptions: {
                    position: 'bottom-right',
                    timestamp: true,
                },
            });
            // Log the upload
            await this.auditLog.log({
                userId: req.user.id,
                action: 'media_upload',
                resource: 'media',
                resourceId: processed.hash,
                details: {
                    filename: file.originalname,
                    size: processed.metadata.size,
                    format: processed.metadata.format,
                    watermarked: processed.watermarked,
                },
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            });
            // TODO: Save media record to database
            // const media = await this.mediaService.create({
            //   userId: req.user.id,
            //   filename: path.basename(processed.path),
            //   originalName: file.originalname,
            //   hash: processed.hash,
            //   size: processed.metadata.size,
            //   width: processed.metadata.width,
            //   height: processed.metadata.height,
            //   duration: processed.metadata.duration,
            //   mimeType: file.mimetype,
            //   watermarked: processed.watermarked,
            // });
            return {
                success: true,
                media: {
                    id: processed.hash, // Use hash as temp ID
                    filename: path.basename(processed.path),
                    size: processed.metadata.size,
                    dimensions: processed.metadata.width ? {
                        width: processed.metadata.width,
                        height: processed.metadata.height,
                    } : undefined,
                    duration: processed.metadata.duration,
                    watermarked: processed.watermarked,
                },
            };
        }
        catch (error) {
            // Clean up on error
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            throw error;
        }
    }
    async getMedia(id, req, res) {
        // TODO: Get media from database
        // const media = await this.mediaService.findOne(id);
        // Check ownership or permissions
        // if (media.userId !== req.user.id && !req.user.isAdmin) {
        //   throw new ForbiddenException();
        // }
        // Log access
        await this.auditLog.log({
            userId: req.user.id,
            action: 'media_access',
            resource: 'media',
            resourceId: id,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        // For now, return a placeholder
        const filePath = path.join('./uploads', `${id}.jpg`); // This would come from DB
        const file = fs.createReadStream(filePath);
        res.set({
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'private, max-age=3600',
        });
        return new common_1.StreamableFile(file);
    }
};
exports.MediaController = MediaController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/temp',
            filename: (req, file, cb) => {
                const userId = req.user?.id || 'anonymous';
                const uniqueName = this.mediaProcessor.generateUniqueFilename(file.originalname, userId);
                cb(null, uniqueName);
            },
        }),
        limits: {
            fileSize: 100 * 1024 * 1024, // 100MB
        },
        fileFilter: (req, file, cb) => {
            const allowedMimes = [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'video/mp4',
                'video/quicktime',
                'video/x-msvideo',
                'video/webm',
            ];
            if (!allowedMimes.includes(file.mimetype)) {
                cb(new common_1.BadRequestException('Invalid file type'), false);
                return;
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, typeof (_a = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getMedia", null);
exports.MediaController = MediaController = __decorate([
    (0, common_1.Controller)('media'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [media_processor_service_1.MediaProcessorService,
        audit_log_service_1.AuditLogService])
], MediaController);
//# sourceMappingURL=media.controller.js.map