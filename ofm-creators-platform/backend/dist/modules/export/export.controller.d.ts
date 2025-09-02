import { Response } from 'express';
import { ExportService } from './export.service';
export declare class ExportController {
    private readonly exportService;
    constructor(exportService: ExportService);
    exportData(req: any, res: Response, view: string, format: string, range?: '7d' | '28d'): Promise<void>;
    private getContentType;
}
//# sourceMappingURL=export.controller.d.ts.map