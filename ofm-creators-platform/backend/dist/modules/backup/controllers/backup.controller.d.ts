import { BackupService } from '../services/backup.service';
export declare class BackupController {
    private readonly backupService;
    constructor(backupService: BackupService);
    createManualBackup(body: {
        type: 'full' | 'database' | 'media' | 'config';
    }): Promise<{
        success: boolean;
        timestamp: Date;
        results: {
            type: string;
            status: string;
        }[];
    }>;
    getBackupStatus(): Promise<{
        lastBackup: Date;
        nextScheduled: Date;
        status: string;
    }>;
}
//# sourceMappingURL=backup.controller.d.ts.map