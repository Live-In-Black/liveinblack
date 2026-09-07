import Event from '../lib/models/Event'
import Conversation from '../lib/models/Conversation'
import Message from '../lib/models/Message'
import MessageDigest from '../lib/models/MessageDigest'
import User from '../lib/models/User'
import Order from '../lib/models/Order'
import Ticket from '../lib/models/Ticket'
import EventInterest from '../lib/models/EventInterest'
import OrganizerFollow from '../lib/models/OrganizerFollow'
import Application from '../lib/models/Application'
import FriendRequest from '../lib/models/FriendRequest'
import Notification from '../lib/models/Notification'
import Report from '../lib/models/Report'
import EventOrder from '../lib/models/EventOrder'
import SeatHold from '../lib/models/SeatHold'
import RateLimit from '../lib/models/RateLimit'
import OrganizerProfile from '../lib/models/OrganizerProfile'
import ProviderProfile from '../lib/models/ProviderProfile'
import RefundCase from '../lib/models/RefundCase'
import { getDb } from '../lib/db/mongoose'

function formatMs(startMs: number) {
  return `${Date.now() - startMs}ms`
}

async function main() {
  const startedAt = Date.now()
  await getDb()
  await Promise.all([
    OrganizerProfile.init(),
    ProviderProfile.init(),
    Event.init(),
    Conversation.init(),
    Message.init(),
    MessageDigest.init(),
    User.init(),
    Order.init(),
    Ticket.init(),
    EventInterest.init(),
    OrganizerFollow.init(),
    Application.init(),
    FriendRequest.init(),
    Notification.init(),
    Report.init(),
    EventOrder.init(),
    SeatHold.init(),
    RateLimit.init(),
  ])
  // This queue index does not require backfilling historical refund references.
  await RefundCase.collection.createIndex({ contestEmailState: 1, contestEmailNextAt: 1, contestEmailLeaseUntil: 1 })
  console.log(`Indexes sync OK (${formatMs(startedAt)})`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Indexes sync failed:', error)
    process.exit(1)
  })
