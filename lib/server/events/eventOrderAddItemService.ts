import type { EventOrderItemView } from './eventOrders'
import type { MessagingErrorResult } from '../messaging/messagingServiceTypes'

export interface OrderCaller {
  id: string
}

export interface AddOrderItemInput {
  eventId: string
  ticketId: string
  menuItemId: string
  quantity: number
}

export type AddOrderItemResult = MessagingErrorResult | { ok: true; item: EventOrderItemView }

// Compatibility entry point for old callers; checkout materialization is separate.
export async function addEventOrderItem(
  caller: OrderCaller,
  input: AddOrderItemInput,
): Promise<AddOrderItemResult> {
  void caller
  void input
  return { ok: false, status: 410, error: 'standalone_orders_disabled_v1' }
}
