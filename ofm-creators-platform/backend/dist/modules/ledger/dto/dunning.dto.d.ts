import { DunningStatus } from '@prisma/client';
export declare class DunningStateDto {
    id: string;
    invoiceId: string;
    creatorId: string;
    attemptCount: number;
    status: DunningStatus;
    lastAttempt?: Date;
    nextAttempt?: Date;
    recoveredAt?: Date;
    writeOffAt?: Date;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}
export declare class PaymentAttemptDto {
    id: string;
    invoiceId: string;
    attemptNumber: number;
    status: string;
    errorCode?: string;
    errorMessage?: string;
    paymentMethodId?: string;
    amount: bigint;
    currency: string;
    createdAt: Date;
}
export declare class UpdatePaymentMethodDto {
    paymentMethodId: string;
    setAsDefault?: boolean;
}
export declare class DunningMetricsDto {
    totalInvoices: number;
    activeCount: number;
    recoveredCount: number;
    writtenOffCount: number;
    suspendedCount: number;
    totalAmountDue: bigint;
    totalRecovered: bigint;
    totalWrittenOff: bigint;
    recoveryRate: number;
    averageRecoveryTime: number;
    byAttempt: Array<{
        attemptNumber: number;
        recoveryCount: number;
        recoveryRate: number;
    }>;
    recentActivity: Array<{
        date: Date;
        invoicesCreated: number;
        recovered: number;
        writtenOff: number;
    }>;
}
export declare class InvoiceRecoveryDto {
    invoiceId: string;
    creatorId: string;
    amount: number;
    currency: string;
    attemptCount: number;
    nextAttempt?: Date;
    daysOverdue: number;
    creator: {
        email: string;
        displayName: string;
        currentPlan: string;
    };
    history: Array<{
        attemptNumber: number;
        date: Date;
        action: string;
        result: string;
    }>;
}
export declare class BulkDunningActionDto {
    invoiceIds: string[];
    action: string;
    reason?: string;
}
export declare class DunningConfigDto {
    enableAutoDunning?: boolean;
    maxAttempts?: number;
    suspensionDelayDays?: number;
    writeOffDelayDays?: number;
    enableSmsNotifications?: boolean;
    customSchedule?: Array<{
        attemptNumber: number;
        delayHours: number;
        emailTemplate: string;
        action?: string;
    }>;
}
//# sourceMappingURL=dunning.dto.d.ts.map