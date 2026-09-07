import { getDb } from '@/lib/db/mongoose'
import OrganizerProfile, { type OrganizerProfileDoc } from '@/lib/models/OrganizerProfile'
import Event from '@/lib/models/Event'
import { isPlaceholderEvent } from '@/lib/shared/eventDiscovery'
import { isEventEnded } from '@/lib/shared/event-time'
import { normalizeGeoText, normalizeRegionId } from '@/lib/shared/locations'
import type { PipelineStage, SortOrder } from 'mongoose'
import { directoryEventPipeline } from './directoryEventPipeline'
import type { PublicEvent } from '../events/events'

export type PublicOrganizer = OrganizerProfileDoc & { userId: string; slug: string }

export type OrganizerDirectoryEvent = {
  id: string
  name: string
  date: string
  dateDisplay: string
  city: string
  region: string
}

export type PublicOrganizerDirectoryEntry = PublicOrganizer & {
  nextEvent: OrganizerDirectoryEvent | null
}

export type PublicOrganizerDirectoryParams = {
  q?: string
  region?: string
  upcoming?: boolean | string
  sort?: 'popular' | 'recent'
  page?: number
  pageSize?: number
  includeTotal?: boolean
}

export type PublicOrganizerDirectoryResult = {
  organizers: PublicOrganizerDirectoryEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const PUBLIC_DIRECTORY_PAGE_SIZE = 20
const MAX_DIRECTORY_PAGE = 4_000
const ORGANIZER_FIELDS =
  'userId slug publicName shortDescription longDescription city country regionId avatarUrl bannerUrl status isVerified followersCount totalEventsCount viewsCount eventClicksCount mediaViewsCount createdAt updatedAt'

const BENIN_EVENT_NAMES = ['Bénin', 'Benin']
const BENIN_REGION_VALUES = ['benin', 'Bénin', 'Benin', 'BJ']

function beninOrganizerClause(): Record<string, unknown> {
  return {
    $and: [
      {
        $or: [
          { regionId: 'benin' },
          { zonesIntervention: { $in: BENIN_REGION_VALUES } },
          { country: { $in: ['Bénin', 'Benin', 'BJ'] } },
        ],
      },
      { $or: [{ regionId: { $in: ['', 'benin'] } }, { regionId: { $exists: false } }] },
      { $or: [{ country: { $in: ['', 'Bénin', 'Benin', 'BJ'] } }, { country: { $exists: false } }] },
      {
        $or: [
          { zonesIntervention: { $exists: false } },
          { zonesIntervention: { $not: { $elemMatch: { $nin: BENIN_REGION_VALUES } } } },
        ],
      },
    ],
  }
}

function beninEventClause(): Record<string, unknown> {
  return { region: { $in: BENIN_EVENT_NAMES }, currency: 'XOF' }
}

function buildOrganizerFilters(params: PublicOrganizerDirectoryParams) {
  const region = params.region?.trim() || ''
  const search = (params.q || '').trim()
  const normalizedSearch = normalizeGeoText(search)

  const filter: Record<string, unknown> = { status: 'public' }
  const andClauses: Record<string, unknown>[] = [beninOrganizerClause()]

  if (region) {
    const regionId = normalizeRegionId(region)
    andClauses.push(
      regionId === 'benin'
        ? beninOrganizerClause()
        : { regionId: '__unsupported_launch_region__' },
    )
  }

  if (search) {
    if (normalizedSearch.length <= 1) {
      andClauses.push({
        $or: [
          { publicName: { $regex: new RegExp(escapeRegex(search), 'i') } },
          { city: { $regex: new RegExp(escapeRegex(search), 'i') } },
          { country: { $regex: new RegExp(escapeRegex(search), 'i') } },
          { shortDescription: { $regex: new RegExp(escapeRegex(search), 'i') } },
        ],
      })
    } else {
      andClauses.push({ $text: { $search: normalizedSearch } })
    }
  }

  if (andClauses.length > 0) filter.$and = andClauses

  return filter
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function organizerSort(sort: PublicOrganizerDirectoryParams['sort'] = 'popular'): Record<string, SortOrder> {
  if (sort === 'recent') return { createdAt: -1 }
  return { followersCount: -1 }
}

/**
 * Legacy: retourne tous les profils organisateurs publics. Conserver pour
 * usages spécifiques (sitemap, exports), la route annuaire doit utiliser la
 * version paginée.
 */
export async function listPublicOrganizers(): Promise<PublicOrganizer[]> {
  await getDb()
  return OrganizerProfile.find(buildOrganizerFilters({}))
    .select(ORGANIZER_FIELDS)
    .sort({ followersCount: -1 })
    .lean()
}

export type OrganizerSitemapEntry = { slug: string; updatedAt?: Date | string | null }

export async function countPublicOrganizersForSitemap(): Promise<number> {
  await getDb()
  return OrganizerProfile.countDocuments(buildOrganizerFilters({})).maxTimeMS(2_000)
}

export async function listPublicOrganizersForSitemapPage(params: { offset: number; limit: number }): Promise<OrganizerSitemapEntry[]> {
  await getDb()
  const offset = Math.max(0, Math.floor(params.offset))
  const limit = Math.min(5_000, Math.max(1, Math.floor(params.limit)))
  const docs = await OrganizerProfile.find(buildOrganizerFilters({}))
    .select('slug updatedAt')
    .sort({ updatedAt: -1, _id: 1 })
    .skip(offset)
    .limit(limit)
    .lean()
  return docs.map((doc) => ({ slug: String(doc.slug), updatedAt: doc.updatedAt }))
}

export async function listPublicOrganizersWithNextEvent(): Promise<PublicOrganizerDirectoryEntry[]> {
  const data = await listPublicOrganizersDirectory()
  return data.organizers
}

export async function listPublicOrganizersDirectory(
  params: PublicOrganizerDirectoryParams = {}
): Promise<PublicOrganizerDirectoryResult> {
  await getDb()
  const page = Math.min(MAX_DIRECTORY_PAGE, Math.max(1, Math.floor(Number(params.page) || 1)))
  const pageSize = Math.max(12, Math.min(200, Math.floor(Number(params.pageSize) || PUBLIC_DIRECTORY_PAGE_SIZE)))
  const includeTotal = params.includeTotal !== false
  const upcoming = params.upcoming === true || params.upcoming === 'true' || params.upcoming === '1'
  const normalizedSearch = normalizeGeoText(params.q || '').trim()
  if (params.q?.trim() && normalizedSearch.length === 1) {
    return { organizers: [], total: 0, page, pageSize, totalPages: 1 }
  }
  const lookup: PipelineStage = {
    $lookup: {
      from: 'events',
      let: { organizerUserId: '$userId' },
      pipeline: [
        { $match: { $expr: { $eq: ['$organizerId', '$$organizerUserId'] } } },
        ...directoryEventPipeline(new Date()),
      ] as Exclude<PipelineStage, PipelineStage.Merge | PipelineStage.Out>[],
      as: '_nextEvents',
    },
  }
  const selection: PipelineStage[] = [
    lookup,
    { $set: { nextEvent: { $arrayElemAt: ['$_nextEvents', 0] } } },
  ]
  const sort: Record<string, 1 | -1> = {
    ...(normalizedSearch.length > 1 ? { _score: -1 as const } : {}),
    ...organizerSort(params.sort) as Record<string, 1 | -1>,
    _id: 1,
  }
  const projection = Object.fromEntries(ORGANIZER_FIELDS.split(' ').map(field => [field, 1]))
  const pipeline: PipelineStage[] = [
    { $match: buildOrganizerFilters(params) },
    ...(normalizedSearch.length > 1 ? [{ $set: { _score: { $meta: 'textScore' } } }] : []),
    ...(upcoming ? [...selection, { $match: { 'nextEvent._id': { $exists: true } } }] : []),
    { $sort: sort },
    { $facet: {
      organizers: [
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize },
        ...(upcoming ? [] : selection),
        { $project: { ...projection, nextEvent: 1 } },
      ] as PipelineStage.Facet['$facet'][string],
      ...(includeTotal ? { totals: [{ $count: 'value' }] } : {}),
    } },
  ]
  const [result] = await OrganizerProfile.aggregate<{
    organizers: Array<PublicOrganizer & { nextEvent?: { _id: unknown; name: string; date: string; dateDisplay?: string; city?: string; region?: string } }>
    totals?: { value: number }[]
  }>(pipeline)
  const organizers = (result?.organizers || []).map(profile => ({
    ...profile,
    nextEvent: profile.nextEvent ? {
      id: String(profile.nextEvent._id),
      name: profile.nextEvent.name,
      date: profile.nextEvent.date,
      dateDisplay: profile.nextEvent.dateDisplay || profile.nextEvent.date,
      city: profile.nextEvent.city || '',
      region: profile.nextEvent.region || '',
    } : null,
  }))
  const total = includeTotal ? result?.totals?.[0]?.value || 0 : organizers.length
  return { organizers, total, page, pageSize, totalPages: includeTotal ? Math.max(1, Math.ceil(total / pageSize)) : 1 }
}

// Pas de bypass "isSelf" ici (contrairement aux prestataires) : fidèle au
// comportement legacy où seul un profil status:'public' est servi publiquement,
// le propriétaire devant passer par son studio pour prévisualiser.
export async function getOrganizerBySlug(slug: string): Promise<PublicOrganizer | null> {
  await getDb()
  const doc = await OrganizerProfile.findOne({ ...buildOrganizerFilters({}), slug }).lean()
  return (doc as PublicOrganizer) || null
}

// Utilisé par le bloc "organisateur" de la page détail événement — ne renvoie
// que si le profil est public (sinon la page détail retombe sur le texte brut
// event.organizerName, comme le faisait déjà le legacy).
export async function getPublicOrganizerByUserId(userId: string): Promise<PublicOrganizer | null> {
  await getDb()
  const doc = await OrganizerProfile.findOne({ ...buildOrganizerFilters({}), userId }).lean()
  return (doc as PublicOrganizer) || null
}

export async function getOrganizerEvents(organizerId: string): Promise<{ upcoming: PublicEvent[]; past: PublicEvent[] }> {
  await getDb()
  const docs = await Event.find({
    organizerId,
    ...beninEventClause(),
    cancelled: { $ne: true },
    isDemo: { $ne: true },
    demoLabel: { $in: [null, ''] },
    isPrivate: { $ne: true },
  })
    .sort({ date: -1 })
    .lean()

  const now = Date.now()
  // Filtre non-privé/non-annulé déjà fait en requête ; ici juste filler + date
  // de publication future — PAS de filtre "pas terminé" : on veut aussi bien
  // les événements à venir que les passés, triés ensuite séparément.
  const events = docs
    .filter((e) => !isPlaceholderEvent(e) && !(e.publishAt && new Date(e.publishAt).getTime() > now))
    .map((e) => ({ ...e, id: String(e._id) })) as PublicEvent[]

  const upcoming = events.filter((e) => !isEventEnded(e, now)).sort((a, b) => a.date.localeCompare(b.date))
  const past = events.filter((e) => isEventEnded(e, now)).slice(0, 6)

  return { upcoming, past }
}
