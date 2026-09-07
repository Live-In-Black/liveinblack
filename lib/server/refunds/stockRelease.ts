import type { ClientSession } from 'mongoose'
import Order from '@/lib/models/Order'
import Event from '@/lib/models/Event'

export async function releaseRefundedOptionStock(orderId: string, eventId: string, session: ClientSession) {
  const order = await Order.findById(orderId).session(session)
  if (!order || order.eventId !== eventId) throw new Error('refund_stock_inconsistent')
  if (!order.stockDecremented || order.refundStockReleasedAt) return
  if (order.status !== 'paid' || !order.paid || order.currency !== 'XOF') throw new Error('refund_stock_inconsistent')
  const event = await Event.findById(eventId).session(session)
  if (!event) throw new Error('refund_stock_inconsistent')
  // Cancellation never reopens sales. A later declaration cannot revive capacity.
  if (event.cancelled) return
  const place = event.places.find(item => item.id === order.placeId)
  const quantity = order.isTable ? 1 : order.qty
  if (!place || !Number.isSafeInteger(quantity) || quantity < 1 || !Number.isFinite(place.available) || !Number.isFinite(place.total)) {
    throw new Error('refund_stock_inconsistent')
  }
  if (place.available < 0 || place.available + quantity > place.total) throw new Error('refund_stock_inconsistent')
  place.available += quantity
  await event.save({ session })
  order.refundStockReleasedAt = new Date()
  await order.save({ session })
}
