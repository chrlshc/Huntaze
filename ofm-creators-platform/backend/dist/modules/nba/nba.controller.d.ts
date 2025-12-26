import { NBAService } from './nba.service';
declare class GetNextActionsDto {
    maxActions?: number;
}
export declare class NBAController {
    private readonly nbaService;
    constructor(nbaService: NBAService);
    getNextActions(req: any, dto: GetNextActionsDto): Promise<{
        actions: import("./nba.service").NBAAction[];
    }>;
    executeAction(req: any, dto: {
        actionId: string;
        params?: Record<string, any>;
    }): Promise<{
        actionId: string;
        status: string;
        message: string;
    }>;
}
export {};
//# sourceMappingURL=nba.controller.d.ts.map