import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PaywallService } from '../services/paywall.service';
import { JwtService } from '@nestjs/jwt';
export declare const CONTENT_ACCESS_KEY = "contentAccess";
export declare const ContentAccess: (options?: {
    allowPreview?: boolean;
}) => (target: any, key?: string, descriptor?: any) => any;
export declare class ContentAccessGuard implements CanActivate {
    private reflector;
    private paywallService;
    private jwtService;
    constructor(reflector: Reflector, paywallService: PaywallService, jwtService: JwtService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
//# sourceMappingURL=content-access.guard.d.ts.map