"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const AWS = __importStar(require("aws-sdk"));
const nodemailer = __importStar(require("nodemailer"));
const fs_1 = require("fs");
const path = __importStar(require("path"));
const handlebars = __importStar(require("handlebars"));
let EmailService = EmailService_1 = class EmailService {
    configService;
    logger = new common_1.Logger(EmailService_1.name);
    ses;
    transporter;
    useAWSSES;
    compiledTemplates = new Map();
    constructor(configService) {
        this.configService = configService;
        this.initializeEmailService();
    }
    initializeEmailService() {
        const awsRegion = this.configService.get('AWS_SES_REGION');
        if (awsRegion) {
            // Use AWS SES
            this.useAWSSES = true;
            this.ses = new AWS.SES({
                region: awsRegion,
                accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
            });
            // Create nodemailer transporter with SES
            this.transporter = nodemailer.createTransport({
                SES: { ses: this.ses, aws: AWS },
            });
            this.logger.log('Using AWS SES for email delivery');
        }
        else {
            // Fallback to SMTP
            this.useAWSSES = false;
            this.transporter = nodemailer.createTransport({
                host: this.configService.get('SMTP_HOST'),
                port: this.configService.get('SMTP_PORT'),
                secure: this.configService.get('SMTP_SECURE', false),
                auth: {
                    user: this.configService.get('SMTP_USER'),
                    pass: this.configService.get('SMTP_PASS'),
                },
            });
            this.logger.log('Using SMTP for email delivery');
        }
    }
    async sendEmail(options) {
        try {
            const html = await this.renderTemplate(options.template, options.data);
            const from = `${this.configService.get('EMAIL_FROM_NAME')} <${this.configService.get('EMAIL_FROM')}>`;
            const mailOptions = {
                from,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                html,
                attachments: options.attachments,
            };
            // Send email
            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email sent successfully to ${options.to}`, {
                messageId: result.messageId,
                subject: options.subject,
            });
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${options.to}`, error);
            throw error;
        }
    }
    async sendBulkEmails(recipients, options) {
        // For AWS SES, batch in groups of 50
        const batchSize = this.useAWSSES ? 50 : 10;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            if (this.useAWSSES && batch.length > 1) {
                // Use SES bulk sending
                await this.sendEmail({
                    ...options,
                    to: batch,
                });
            }
            else {
                // Send individually
                await Promise.all(batch.map(recipient => this.sendEmail({
                    ...options,
                    to: recipient,
                })));
            }
            // Rate limiting for SES (14 emails/second)
            if (this.useAWSSES && i + batchSize < recipients.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    async renderTemplate(templateName, data) {
        // Check cache
        let template = this.compiledTemplates.get(templateName);
        if (!template) {
            // Load and compile template
            const templatePath = path.join(__dirname, '..', '..', '..', 'templates', 'emails', `${templateName}.hbs`);
            try {
                const templateContent = await fs_1.promises.readFile(templatePath, 'utf-8');
                template = handlebars.compile(templateContent);
                this.compiledTemplates.set(templateName, template);
            }
            catch (error) {
                this.logger.error(`Failed to load email template: ${templateName}`, error);
                // Fallback to simple template
                return this.getDefaultTemplate(templateName, data);
            }
        }
        return template(data);
    }
    getDefaultTemplate(templateName, data) {
        const templates = {
            welcome: `
        <h1>Welcome to Huntaze!</h1>
        <p>Hi ${data.name},</p>
        <p>Thank you for joining Huntaze. We're excited to have you on board!</p>
        <p>Get started by connecting your OnlyFans account.</p>
      `,
            resetPassword: `
        <h1>Reset Your Password</h1>
        <p>Hi ${data.name},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${data.resetLink}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      `,
            subscription: `
        <h1>Subscription Confirmed</h1>
        <p>Hi ${data.name},</p>
        <p>Your ${data.planName} subscription is now active!</p>
        <p>Thank you for choosing Huntaze.</p>
      `,
            dmcaNotice: `
        <h1>DMCA Takedown Update</h1>
        <p>Hi ${data.name},</p>
        <p>Your DMCA takedown request (${data.caseNumber}) has been updated.</p>
        <p>Status: ${data.status}</p>
      `,
        };
        return templates[templateName] || '<p>Email content</p>';
    }
    // Verify email configuration
    async verifyEmailService() {
        try {
            if (this.useAWSSES) {
                // Verify SES sending quota
                const quota = await this.ses.getSendQuota().promise();
                this.logger.log('AWS SES quota:', {
                    max24HourSend: quota.Max24HourSend,
                    sentLast24Hours: quota.SentLast24Hours,
                    maxSendRate: quota.MaxSendRate,
                });
                return true;
            }
            else {
                // Verify SMTP connection
                await this.transporter.verify();
                this.logger.log('SMTP connection verified');
                return true;
            }
        }
        catch (error) {
            this.logger.error('Email service verification failed:', error);
            return false;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map