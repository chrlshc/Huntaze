"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostToGroupDto = exports.CreateAccountGroupDto = exports.CrossPostRequestDto = exports.PostContentDto = exports.MediaDto = exports.CrossPostOptionsDto = exports.StaggerPostingOptionsDto = exports.CrossPostAccountDto = exports.AccountCustomizationDto = exports.SocialPlatform = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var SocialPlatform;
(function (SocialPlatform) {
    SocialPlatform["INSTAGRAM"] = "instagram";
    SocialPlatform["TIKTOK"] = "tiktok";
    SocialPlatform["TWITTER"] = "twitter";
    SocialPlatform["REDDIT"] = "reddit";
})(SocialPlatform || (exports.SocialPlatform = SocialPlatform = {}));
class AccountCustomizationDto {
    caption;
    hashtags;
    mentions;
}
exports.AccountCustomizationDto = AccountCustomizationDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AccountCustomizationDto.prototype, "caption", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AccountCustomizationDto.prototype, "hashtags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AccountCustomizationDto.prototype, "mentions", void 0);
class CrossPostAccountDto {
    id;
    platform;
    customizations;
}
exports.CrossPostAccountDto = CrossPostAccountDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CrossPostAccountDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(SocialPlatform),
    __metadata("design:type", String)
], CrossPostAccountDto.prototype, "platform", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AccountCustomizationDto),
    __metadata("design:type", AccountCustomizationDto)
], CrossPostAccountDto.prototype, "customizations", void 0);
class StaggerPostingOptionsDto {
    enabled;
    intervalMinutes;
}
exports.StaggerPostingOptionsDto = StaggerPostingOptionsDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], StaggerPostingOptionsDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], StaggerPostingOptionsDto.prototype, "intervalMinutes", void 0);
class CrossPostOptionsDto {
    autoHashtags;
    watermark;
    trackingLink;
    staggerPosting;
}
exports.CrossPostOptionsDto = CrossPostOptionsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CrossPostOptionsDto.prototype, "autoHashtags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CrossPostOptionsDto.prototype, "watermark", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CrossPostOptionsDto.prototype, "trackingLink", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => StaggerPostingOptionsDto),
    __metadata("design:type", StaggerPostingOptionsDto)
], CrossPostOptionsDto.prototype, "staggerPosting", void 0);
class MediaDto {
    type;
    url;
    thumbnail;
}
exports.MediaDto = MediaDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MediaDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MediaDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MediaDto.prototype, "thumbnail", void 0);
class PostContentDto {
    caption;
    media;
    hashtags;
    mentions;
    scheduledFor;
}
exports.PostContentDto = PostContentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PostContentDto.prototype, "caption", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MediaDto),
    __metadata("design:type", Array)
], PostContentDto.prototype, "media", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PostContentDto.prototype, "hashtags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PostContentDto.prototype, "mentions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PostContentDto.prototype, "scheduledFor", void 0);
class CrossPostRequestDto {
    content;
    accounts;
    options;
}
exports.CrossPostRequestDto = CrossPostRequestDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PostContentDto),
    __metadata("design:type", PostContentDto)
], CrossPostRequestDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CrossPostAccountDto),
    __metadata("design:type", Array)
], CrossPostRequestDto.prototype, "accounts", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CrossPostOptionsDto),
    __metadata("design:type", CrossPostOptionsDto)
], CrossPostRequestDto.prototype, "options", void 0);
class CreateAccountGroupDto {
    name;
    description;
    accountIds;
}
exports.CreateAccountGroupDto = CreateAccountGroupDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAccountGroupDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAccountGroupDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateAccountGroupDto.prototype, "accountIds", void 0);
class PostToGroupDto {
    groupId;
    content;
}
exports.PostToGroupDto = PostToGroupDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PostToGroupDto.prototype, "groupId", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PostContentDto),
    __metadata("design:type", PostContentDto)
], PostToGroupDto.prototype, "content", void 0);
//# sourceMappingURL=social-media.dto.js.map