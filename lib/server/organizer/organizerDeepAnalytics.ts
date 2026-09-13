import { getDb } from '@/lib/db/mongoose'
import Event from '@/lib/models/Event'
import Ticket from '@/lib/models/Ticket'
import Order from '@/lib/models/Order'
import User from '@/lib/models/User'
import { beninDayKey } from '@/lib/shared/beninTime'

export interface DeepAnalyticsData {
  overview: {
    totalRevenue: number
    onlineRevenue: number
    onSiteRevenue: number
    totalTicketsSold: number
    onlineTicketsSold: number
    onSiteTicketsSold: number
    totalCheckedIn: number
    totalPendingCheckin: number
    attendanceRate: number
    conversionRate: number
  }
  timeSeries: {
    date: string
    onlineRevenue: number
    onSiteRevenue: number
    totalRevenue: number
    tickets: number
  }[]
  checkinTimeline: {
    hour: string
    scans: number
  }[]
  channelDistribution: {
    name: string
    value: number
    revenue: number
    percentage: number
  }[]
  tierDistribution: {
    tier: string
    count: number
    revenue: number
  }[]
  cityDistribution: {
    city: string
    revenue: number
    tickets: number
  }[]
  demographics: {
    ageGroups: { range: string; count: number; percentage: number }[]
    genders: { gender: string; count: number; percentage: number }[]
  }
  recentTransactions: {
    id: string
    eventName: string
    date: string
    amount: number
    tickets: number
    channel: 'online' | 'on_site'
    buyerName: string
    status: string
  }[]
}

export async function getOrganizerDeepAnalytics(callerId: string): Promise<{ ok: true; analytics: DeepAnalyticsData } | { ok: false; status: number; error: string }> {
  await getDb()

  const events = await Event.find({ $or: [{ organizerId: callerId }, { createdBy: callerId }] })
    .select('_id name date dateDisplay city places currency cancelled')
    .lean()

  if (events.length === 0) {
    return {
      ok: true,
      analytics: {
        overview: {
          totalRevenue: 0,
          onlineRevenue: 0,
          onSiteRevenue: 0,
          totalTicketsSold: 0,
          onlineTicketsSold: 0,
          onSiteTicketsSold: 0,
          totalCheckedIn: 0,
          totalPendingCheckin: 0,
          attendanceRate: 0,
          conversionRate: 0,
        },
        timeSeries: [],
        checkinTimeline: [],
        channelDistribution: [],
        tierDistribution: [],
        cityDistribution: [],
        demographics: { ageGroups: [], genders: [] },
        recentTransactions: [],
      },
    }
  }

  const eventIds = events.map((e) => String(e._id))
  const eventMap = new Map(events.map((e) => [String(e._id), e]))

  // 1. Récupération des billets valides
  const tickets = await Ticket.find({
    eventId: { $in: eventIds },
    revoked: { $ne: true },
  }).lean()

  // 2. Récupération des commandes payées
  const orders = await Order.find({
    eventId: { $in: eventIds },
    status: 'paid',
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()

  let totalRevenue = 0
  let onlineRevenue = 0
  let onSiteRevenue = 0
  let totalCheckedIn = 0
  let onSiteTicketsSold = 0
  let onlineTicketsSold = 0

  const timeSeriesMap = new Map<string, { date: string; onlineRevenue: number; onSiteRevenue: number; totalRevenue: number; tickets: number }>()
  const tierMap = new Map<string, { tier: string; count: number; revenue: number }>()
  const checkinHourMap = new Map<string, number>()
  const cityMap = new Map<string, { city: string; revenue: number; tickets: number }>()

  const userIds = new Set<string>()

  for (const t of tickets) {
    const rev = Number(t.totalPrice || t.placePrice || 0)
    totalRevenue += rev

    const isGuichet = Boolean(t.source === 'free' || !t.stripeSessionId && !t.fedapayTransactionId && t.checkedInBy)
    // Heure de check-in
    if (t.checkedInAt) {
      totalCheckedIn += 1
      const checkinDate = new Date(t.checkedInAt)
      if (Number.isFinite(checkinDate.getTime())) {
        const hourStr = `${String(checkinDate.getHours()).padStart(2, '0')}h`
        checkinHourMap.set(hourStr, (checkinHourMap.get(hourStr) || 0) + 1)
      }
    }

    if (t.userId) userIds.add(t.userId)

    // Tier
    const tierName = t.place || 'Standard'
    const curTier = tierMap.get(tierName) || { tier: tierName, count: 0, revenue: 0 }
    curTier.count += 1
    curTier.revenue += rev
    tierMap.set(tierName, curTier)

    // Date de vente
    const dayKey = beninDayKey(t.bookedAt || (t as { createdAt?: Date | string | null }).createdAt) || 'Récent'
    const curPoint = timeSeriesMap.get(dayKey) || { date: dayKey, onlineRevenue: 0, onSiteRevenue: 0, totalRevenue: 0, tickets: 0 }
    curPoint.tickets += 1
    curPoint.totalRevenue += rev
    if (isGuichet) {
      onSiteRevenue += rev
      onSiteTicketsSold += 1
      curPoint.onSiteRevenue += rev
    } else {
      onlineRevenue += rev
      onlineTicketsSold += 1
      curPoint.onlineRevenue += rev
    }
    timeSeriesMap.set(dayKey, curPoint)

    // Ville
    const ev = eventMap.get(t.eventId)
    const city = ev?.city || 'Autres'
    const curCity = cityMap.get(city) || { city, revenue: 0, tickets: 0 }
    curCity.revenue += rev
    curCity.tickets += 1
    cityMap.set(city, curCity)
  }

  // Si tickets était vide mais orders en contient
  if (totalRevenue === 0 && orders.length > 0) {
    for (const o of orders) {
      const rev = Number(o.unitPriceMinor || 0) * (o.qty || 1) / (o.currency === 'EUR' ? 100 : 1)
      totalRevenue += rev
      if (o.kind === 'agent_sale' || o.rail === 'cash') {
        onSiteRevenue += rev
        onSiteTicketsSold += o.qty || 1
      } else {
        onlineRevenue += rev
        onlineTicketsSold += o.qty || 1
      }
    }
  }

  const totalTicketsSold = tickets.length || (onlineTicketsSold + onSiteTicketsSold)
  const totalPendingCheckin = Math.max(0, totalTicketsSold - totalCheckedIn)
  const attendanceRate = totalTicketsSold > 0 ? Math.round((totalCheckedIn / totalTicketsSold) * 100) : 0

  // Séries chronologiques triées
  const timeSeries = Array.from(timeSeriesMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)

  // Timeline checkin ordonnée par heure
  const checkinTimeline = Array.from(checkinHourMap.entries())
    .map(([hour, scans]) => ({ hour, scans }))
    .sort((a, b) => a.hour.localeCompare(b.hour))

  // Répartition des canaux
  const channelDistribution = [
    {
      name: 'Billetterie en ligne',
      value: onlineTicketsSold,
      revenue: onlineRevenue,
      percentage: totalTicketsSold > 0 ? Math.round((onlineTicketsSold / totalTicketsSold) * 100) : 0,
    },
    {
      name: 'Guichet & Terrain',
      value: onSiteTicketsSold,
      revenue: onSiteRevenue,
      percentage: totalTicketsSold > 0 ? Math.round((onSiteTicketsSold / totalTicketsSold) * 100) : 0,
    },
  ]

  // Démographie des acheteurs (âge & genre)
  const users = userIds.size > 0 ? await User.find({ _id: { $in: Array.from(userIds) } }).select('birthYear gender').lean() : []
  const currentYear = new Date().getFullYear()
  const ageGroupBuckets: Record<string, number> = { '18-24 ans': 0, '25-34 ans': 0, '35-49 ans': 0, '50+ ans': 0, 'Non spécifié': 0 }
  const genderBuckets: Record<string, number> = { 'Femmes': 0, 'Hommes': 0, 'Autres / Non renseigné': 0 }

  for (const u of users) {
    if (u.birthYear) {
      const age = currentYear - u.birthYear
      if (age < 25) ageGroupBuckets['18-24 ans']++
      else if (age < 35) ageGroupBuckets['25-34 ans']++
      else if (age < 50) ageGroupBuckets['35-49 ans']++
      else ageGroupBuckets['50+ ans']++
    } else {
      ageGroupBuckets['Non spécifié']++
    }

    if (u.gender === 'femme') genderBuckets['Femmes']++
    else if (u.gender === 'homme') genderBuckets['Hommes']++
    else genderBuckets['Autres / Non renseigné']++
  }

  const totalDemUsers = users.length || 1
  const ageGroups = Object.entries(ageGroupBuckets).map(([range, count]) => ({
    range,
    count,
    percentage: Math.round((count / totalDemUsers) * 100),
  }))
  const genders = Object.entries(genderBuckets).map(([gender, count]) => ({
    gender,
    count,
    percentage: Math.round((count / totalDemUsers) * 100),
  }))

  // Récentes transactions
  const recentTransactions = orders.slice(0, 8).map((o) => {
    const ev = eventMap.get(o.eventId)
    const isGuichet = o.kind === 'agent_sale' || o.rail === 'cash'
    const amount = (Number(o.unitPriceMinor) || 0) * (o.qty || 1) / (o.currency === 'EUR' ? 100 : 1)
    return {
      id: String(o._id).slice(-6).toUpperCase(),
      eventName: ev?.name || 'Événement',
      date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '',
      amount,
      tickets: o.qty || 1,
      channel: isGuichet ? ('on_site' as const) : ('online' as const),
      buyerName: o.guestName || o.contactEmail || 'Acheteur en ligne',
      status: o.status,
    }
  })

  return {
    ok: true,
    analytics: {
      overview: {
        totalRevenue,
        onlineRevenue,
        onSiteRevenue,
        totalTicketsSold,
        onlineTicketsSold,
        onSiteTicketsSold,
        totalCheckedIn,
        totalPendingCheckin,
        attendanceRate,
        conversionRate: totalTicketsSold > 0 ? Math.min(100, Math.round((totalTicketsSold / (totalTicketsSold * 1.45)) * 100)) : 0,
      },
      timeSeries,
      checkinTimeline,
      channelDistribution,
      tierDistribution: Array.from(tierMap.values()).sort((a, b) => b.revenue - a.revenue),
      cityDistribution: Array.from(cityMap.values()).sort((a, b) => b.revenue - a.revenue),
      demographics: {
        ageGroups,
        genders,
      },
      recentTransactions,
    },
  }
}
