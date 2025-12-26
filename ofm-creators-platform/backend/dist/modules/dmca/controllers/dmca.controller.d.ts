import { StreamableFile } from '@nestjs/common';
import { DmcaService, DmcaTakedownRequest } from '../services/dmca.service';
export declare class DmcaController {
    private readonly dmcaService;
    constructor(dmcaService: DmcaService);
    createTakedown(request: DmcaTakedownRequest, req: any): Promise<{
        success: boolean;
        takedownId: string;
        message: string;
    }>;
    getUserTakedowns(status: string, req: any): Promise<{
        takedowns: any[];
        total: number;
    }>;
    getTakedownDetails(id: string, req: any): Promise<any>;
    downloadNotice(id: string, req: any): Promise<StreamableFile>;
    updateTakedown(id: string, update: {
        status: 'processing' | 'completed' | 'rejected';
        responseNotes?: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getStats(req: any): Promise<{
        total: number;
        pending: number;
        completed: number;
        rejected: number;
        averageResponseTime: number;
    }>;
    getGlobalStats(): Promise<{
        total: number;
        pending: number;
        completed: number;
        rejected: number;
        averageResponseTime: number;
    }>;
    getRunbook(type: 'leak' | 'doxxing' | 'harassment'): {
        type: "leak" | "doxxing" | "harassment";
        runbook: string;
        lastUpdated: string;
    };
    checkContentMatch(body: {
        contentHash: string;
    }, req: any): Promise<{
        isMatch: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=dmca.controller.d.ts.map