// Simple billing utilities - use SimpleBillingService for full functionality
export type Customer = { id: string }

export async function getOrCreateCustomer(userId: string, email?: string): Promise<Customer> {
  // This is a legacy function - use SimpleBillingService.createCheckoutSession instead
  const id = `cus_${userId.slice(0, 8)}`
  return { id }
}

// Re-export the main billing service
export { SimpleBillingService } from './services/simple-billing-service';

