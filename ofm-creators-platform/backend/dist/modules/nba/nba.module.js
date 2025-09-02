"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NBAModule = void 0;
const common_1 = require("@nestjs/common");
const nba_controller_1 = require("./nba.controller");
const nba_service_1 = require("./nba.service");
const prisma_module_1 = require("@infrastructure/prisma/prisma.module");
let NBAModule = class NBAModule {
};
exports.NBAModule = NBAModule;
exports.NBAModule = NBAModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [nba_controller_1.NBAController],
        providers: [nba_service_1.NBAService],
        exports: [nba_service_1.NBAService],
    })
], NBAModule);
//# sourceMappingURL=nba.module.js.map