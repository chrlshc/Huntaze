import { StreamableFile } from '@nestjs/common';
import { Express, Response } from 'express';
import { MediaProcessorService } from '../services/media-processor.service';
import { AuditLogService } from '@/modules/audit/services/audit-log.service';
interface MulterFile extends Express.Multer.File {
}
export declare class MediaController {
    private readonly mediaProcessor;
    private readonly auditLog;
    constructor(mediaProcessor: MediaProcessorService, auditLog: AuditLogService);
    uploadFile(file: MulterFile, req: any): Promise<{
        success: boolean;
        media: {
            id: string;
            filename: string;
            size: number;
            dimensions: {
                width: number;
                height: number | undefined;
            } | undefined;
            duration: number | undefined;
            watermarked: boolean;
        };
    }>;
    getMedia(id: string, req: any, res: Response): Promise<StreamableFile>;
}
export { MediaProcessorService };
//# sourceMappingURL=media.controller.d.ts.map