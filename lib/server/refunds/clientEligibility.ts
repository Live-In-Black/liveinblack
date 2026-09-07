import { isBeforeCancellationOptionDeadline } from '@/lib/shared/refundPolicy'

export function clientRefundEligibility(
  order: { status: string; paid: boolean; clientRefundRequestedAt?: Date | null; rail: string; currency: string; cancellationProtectionPurchased: boolean; cancellationProtectionFeeMinor: number },
  event: { cancelled: boolean; postponedFrom?: unknown; refundWindowClosesAt?: Date | null; closingDate?: Date | null },
  now = new Date(),
): { ok: true; cause: 'cancellation_option' | 'postponed_declined' } | { ok: false; status: number; error: string } {
  if (order.status !== 'paid' || !order.paid) return { ok: false, status: 409, error: 'order_not_paid' }
  if (order.clientRefundRequestedAt) return { ok: false, status: 409, error: 'already_requested' }
  if (order.rail === 'free') return { ok: false, status: 409, error: 'free_ticket_not_refundable' }
  if (order.currency !== 'XOF') return { ok: false, status: 409, error: 'xof_required' }
  if (event.cancelled) return { ok: false, status: 409, error: 'event_cancelled_cash_pickup_created' }
  // Le refus du report ouvre un droit plus large que l'option volontaire.
  if (event.postponedFrom && event.refundWindowClosesAt && now.getTime() < event.refundWindowClosesAt.getTime()) {
    return { ok: true, cause: 'postponed_declined' }
  }
  if (order.cancellationProtectionPurchased && order.cancellationProtectionFeeMinor > 0 && isBeforeCancellationOptionDeadline(event.closingDate, now)) {
    return { ok: true, cause: 'cancellation_option' }
  }
  return { ok: false, status: 409, error: event.postponedFrom ? 'refund_window_closed' : 'not_eligible' }
}
