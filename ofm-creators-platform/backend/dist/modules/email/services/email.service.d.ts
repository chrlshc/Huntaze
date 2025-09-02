import { ConfigService } from '@nestjs/config';
export interface EmailOptions {
    to: string | string[];
    subject: string;
    template: string;
    data: any;
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
}
export declare class EmailService {
    private configService;
    private readonly logger;
    private ses;
    private transporter;
    private useAWSSES;
    private compiledTemplates;
    constructor(configService: ConfigService);
    private initializeEmailService;
    sendEmail(options: EmailOptions): Promise<void>;
    sendBulkEmails(recipients: string[], options: Omit<EmailOptions, 'to'>): Promise<void>;
    private renderTemplate;
    private getDefaultTemplate;
    verifyEmailService(): Promise<boolean>;
}
//# sourceMappingURL=email.service.d.ts.map