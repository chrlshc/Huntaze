export type Customer = { id: string }

export async function getOrCreateCustomer(userId: string, email?: string): Promise<Customer> {
  // Minimal placeholder implementation. Replace with real billing integration.
  const id = `cus_${userId.slice(0, 8)}`
  return { id }
}

