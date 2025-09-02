"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgeVerificationModule = void 0;
const common_1 = require("@nestjs/common");
const age_verification_service_1 = require("./age-verification.service");
const age_verification_controller_1 = require("./age-verification.controller");
const prisma_module_1 = require("@infrastructure/prisma/prisma.module");
const s3_module_1 = require("@infrastructure/s3/s3.module");
const audit_module_1 = require("@infrastructure/audit/audit.module");
let AgeVerificationModule = class AgeVerificationModule {
};
exports.AgeVerificationModule = AgeVerificationModule;
exports.AgeVerificationModule = AgeVerificationModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, s3_module_1.S3Module, audit_module_1.AuditModule],
        controllers: [age_verification_controller_1.AgeVerificationController],
        providers: [age_verification_service_1.AgeVerificationService],
        exports: [age_verification_service_1.AgeVerificationService],
    })
], AgeVerificationModule);
//# sourceMappingURL=age-verification.module.js.map