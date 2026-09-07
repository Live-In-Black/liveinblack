import { getDb } from '../lib/db/mongoose'
import Event from '../lib/models/Event'
import OrganizerProfile from '../lib/models/OrganizerProfile'
import BlogPost from '../lib/models/BlogPost'
import { buildBeninCampaign } from './blog-benin-campaign'

const APPLY = process.argv.includes('--apply')
const CONFIRM_PROD = process.argv.includes('--confirm-prod')
const INCLUDE_EVENTS = !process.argv.includes('--articles-only')
const ORGANIZER_ID = valueAfter('--organizer-id')

function valueAfter(flag: string): string | null {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1]?.trim() || null : null
}

function dateInDays(days: number): string {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 10)
}

function displayDate(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Porto-Novo',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(/\./g, '')
    .toUpperCase()
}

function usage(): never {
  console.error(`Usage:
  npm run publish:test-content -- --organizer-id=<USER_ID>
  npm run publish:test-content -- --articles-only
  npm run publish:test-content -- --apply --organizer-id=<USER_ID>
  npm run publish:test-content -- --apply --confirm-prod --organizer-id=<USER_ID>

Par défaut, la commande affiche uniquement un aperçu. Les événements exigent un
organisateur existant dont le profil est public. L'événement privé de la fixture
n'est jamais publié.`)
  process.exit(1)
}

if (process.argv.includes('--help')) usage()

async function main() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'

  if (isProduction && (!APPLY || !CONFIRM_PROD)) {
    throw new Error('En production, ajoute --apply --confirm-prod pour autoriser la publication.')
  }

  if (INCLUDE_EVENTS && !ORGANIZER_ID) {
    throw new Error('Un --organizer-id est obligatoire pour publier les événements. Utilise --articles-only pour publier uniquement les articles.')
  }

  const posts = buildBeninCampaign(new Date())
  if (!APPLY) {
    console.log(`Aperçu : ${posts.length} articles${INCLUDE_EVENTS ? ' et 3 événements' : ''}.`)
    console.log('Aucune écriture effectuée. Ajoute --apply pour appliquer cette publication.')
    return
  }

  await getDb()

  const organizer = ORGANIZER_ID
    ? await OrganizerProfile.findOne({ userId: ORGANIZER_ID, status: 'public' }).select('userId publicName slug').lean()
    : null

  if (INCLUDE_EVENTS && !organizer) {
    throw new Error(`Aucun profil organisateur public trouvé pour ${ORGANIZER_ID}.`)
  }

  const eventDate1 = dateInDays(30)
  const eventDate2 = dateInDays(45)
  const eventDate3 = dateInDays(60)
  const events = organizer
    ? [
        {
          name: 'AFRO NATION COTONOU',
          subtitle: 'La plus grosse soirée afrobeat du mois',
          description: "Une nuit dédiée à l'afrobeat et à l'amapiano, avec une expérience premium.",
          category: 'Afrobeat',
          tags: ['Afrobeat', 'Premium'],
          date: eventDate1,
          dateDisplay: displayDate(eventDate1),
          time: '22:00',
          endTime: '05:00',
          location: 'Club Oxygène, Cotonou',
          city: 'Cotonou',
          region: 'Bénin',
          currency: 'XOF',
          imageUrl: '/images/live-in-black/directory/directory-events-vip-entry.png',
          color: '#c8a96e',
          places: [
            { id: 'p1', type: 'Entrée standard', price: 5000, available: 200, total: 200, maxPerAccount: 4 },
            { id: 'p2', type: 'VIP', price: 15000, available: 20, total: 20, maxPerAccount: 2 },
          ],
          artists: [{ name: 'DJ Koffi', role: 'DJ' }, { name: 'MC Ama', role: 'MC' }],
        },
        {
          name: 'HOUSE SESSION PORTO-NOVO',
          subtitle: 'Deep house & techno',
          description: 'Une soirée house intimiste dans un cadre exclusif.',
          category: 'House',
          tags: ['House', 'Techno'],
          date: eventDate2,
          dateDisplay: displayDate(eventDate2),
          time: '23:00',
          endTime: '06:00',
          location: 'Rooftop Centre-ville, Porto-Novo',
          city: 'Porto-Novo',
          region: 'Bénin',
          currency: 'XOF',
          imageUrl: '/images/live-in-black/home/home-step-qr-entry.png',
          places: [{ id: 'p1', type: 'Entrée', price: 5000, available: 80, total: 80, maxPerAccount: 4 }],
          artists: [{ name: 'DJ Koffi', role: 'DJ' }],
        },
        {
          name: 'SUNSET LIVE COTONOU',
          subtitle: 'Live music face à la mer',
          description: 'Un rendez-vous musical accessible pour découvrir des artistes locaux.',
          category: 'Live band',
          tags: ['Live', 'Cotonou'],
          date: eventDate3,
          dateDisplay: displayDate(eventDate3),
          time: '18:00',
          endTime: '23:00',
          location: 'Espace plage, Cotonou',
          city: 'Cotonou',
          region: 'Bénin',
          currency: 'XOF',
          imageUrl: '/images/live-in-black/home/home-step-discover-cotonou.png',
          places: [{ id: 'p1', type: 'Entrée', price: 3000, available: 150, total: 150, maxPerAccount: 6 }],
          artists: [{ name: 'Live In Black Band', role: 'Live band' }],
        },
      ].map((event) => ({
        ...event,
        eventType: 'public',
        userCreated: true,
        isDemo: false,
        isPrivate: false,
        cancelled: false,
        publishAt: null,
        publishedAt: new Date(),
        minAge: 18,
        createdBy: organizer.userId,
        organizerId: organizer.userId,
        organizerName: organizer.publicName,
        organizer: organizer.publicName,
      }))
    : []

  const blogResult = await BlogPost.bulkWrite(
    posts.map((post) => ({
      updateOne: {
        filter: { slug: post.slug },
        update: { $set: post },
        upsert: true,
      },
    })),
    { ordered: false }
  )

  const eventResults = await Promise.all(
    events.map((event) =>
      Event.findOneAndUpdate(
        { name: event.name, organizerId: event.organizerId },
        { $set: event },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      )
    )
  )

  console.log(`Publication terminée : ${blogResult.upsertedCount} article(s) créé(s), ${blogResult.modifiedCount} article(s) mis à jour, ${eventResults.length} événement(s) public(s).`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
