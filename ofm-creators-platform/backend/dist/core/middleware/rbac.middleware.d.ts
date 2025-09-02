import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserRbacService } from '@/modules/users/services/user-rbac.service';
export interface RequestWithUser extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        permissions?: string[];
    };
}
export declare class RbacMiddleware implements NestMiddleware {
    private readonly userRbacService;
    constructor(userRbacService: UserRbacService);
    use(req: RequestWithUser, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=rbac.middleware.d.ts.map