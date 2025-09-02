import { DunningService } from '../services/dunning.service';
import { UpdatePaymentMethodDto, BulkDunningActionDto, DunningConfigDto } from '../dto/dunning.dto';
export declare class DunningController {
    private readonly dunningService;
    constructor(dunningService: DunningService);
    /**
     * Get dunning metrics
     */
    getMetrics(user: any, startDate?: string, endDate?: string): Promise<any>;
    /**
     * Get active dunning cases
     */
    getActiveCases(user: any, page?: number, limit?: number): Promise<any>;
    /**
     * Get dunning history for a specific invoice
     */
    getInvoiceHistory(user: any, invoiceId: string): Promise<any>;
    /**
     * Update payment method and retry
     */
    updatePaymentMethod(user: any, dto: UpdatePaymentMethodDto): Promise<any>;
    /**
     * Manually retry a failed payment
     */
    retryPayment(user: any, invoiceId: string): Promise<any>;
    /**
     * Bulk dunning actions (admin)
     */
    bulkAction(user: any, dto: BulkDunningActionDto): Promise<any>;
    /**
     * Get dunning configuration
     */
    getConfig(user: any): Promise<any>;
    /**
     * Update dunning configuration
     */
    updateConfig(user: any, dto: DunningConfigDto): Promise<any>;
    /**
     * Get recovery predictions
     */
    getRecoveryPredictions(user: any): Promise<any>;
    /**
     * Request payment plan (for large outstanding amounts)
     */
    requestPaymentPlan(user: any, dto: {
        invoiceIds: string[];
        installments: number;
    }): Promise<any>;
}
//# sourceMappingURL=dunning.controller.d.ts.map