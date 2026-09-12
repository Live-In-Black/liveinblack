import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { ArrowUpRight, MapPin, Search, SlidersHorizontal, Users, X } from 'lucide-react'
import { auth } from '@/auth'
import { getCachedPublicOrganizersDirectory } from '@/lib/server/publicCache'
import { hasAuthSessionCookie } from '@/lib/server/authSessionCookie'
import { listMyFollowedOrganizers } from '@/lib/server/organizer/organizerFollows'
import { getEntityRegionIds, getRegionName } from '@/lib/shared/locations'
import { reliablePhotoUrl } from '@/lib/shared/placeholderImage'
import OrganizerFollowButtonClient from '@/app/components/features/organizer/OrganizerFollowButtonClient'
import FilterSelect from '../_components/FilterSelect'
import UnifiedSearchBar from '../_components/UnifiedSearchBar'
import { Button, Input, Mascot, PageLinks } from '@/app/components/ui'
import styles from './organizers.module.css'

const SITE = process.env.PUBLIC_SITE_URL || 'https://liveinblack.com'
const DIRECTORY_RENDER_TIMEOUT_MS = 2_500

type OrganizerDirectoryResult = Awaited<ReturnType<typeof getCachedPublicOrganizersDirectory>>

export const metadata: Metadata = {
  title: 'Organisateurs — LIVEINBLACK',
  description: "Découvrez les organisateurs d'événements et suivez ceux qui font vivre la scène sur LIVEINBLACK.",
  alternates: { canonical: '/organizers' },
  robots: { index: true, follow: true },
  openGraph: {
    url: '/organizers',
    siteName: 'LIVEINBLACK',
    locale: 'fr_BJ',
    title: 'Organisateurs d’événements au Bénin — LIVEINBLACK',
    description: 'Découvrez les organisateurs qui font vivre la scène événementielle au Bénin.',
  },
}

type DirectoryParams = { q?: string; region?: string; upcoming?: string; sort?: string; page?: string }

function withDirectoryTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), DIRECTORY_RENDER_TIMEOUT_MS)
    }),
  ]).catch(() => fallback)
}

export default async function PublicOrganizersPage({ searchParams }: { searchParams: Promise<DirectoryParams> }) {
  const [{ q, sort = 'popular', page: pageParam }, cookieStore] = await Promise.all([
    searchParams,
    cookies(),
  ])
  const search = (q || '').trim()
  const requestedPage = Math.max(1, Number(pageParam) || 1)
  const hasSessionCookie = hasAuthSessionCookie(cookieStore.getAll())
  const session = hasSessionCookie ? await auth() : null

  const emptyDirectory: OrganizerDirectoryResult = { organizers: [], total: 0, page: requestedPage, pageSize: 24, totalPages: 1 }
  const { organizers, total, totalPages, pageSize } = await withDirectoryTimeout(getCachedPublicOrganizersDirectory({
    q: search,
    region: 'benin',
    upcoming: false,
    sort: sort === 'recent' ? 'recent' : 'popular',
    page: requestedPage,
    pageSize: 24,
  }), emptyDirectory)

  const followResult = session?.user ? await listMyFollowedOrganizers({ id: session.user.id }) : { ok: true as const, follows: [] }
  const followedIds = new Set(followResult.ok ? followResult.follows.map((follow) => follow.organizerId) : [])

  const hasFilters = Boolean(search || sort !== 'popular')
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE}/organizers#itemlist`,
    name: 'Organisateurs d’événements au Bénin sur LIVEINBLACK',
    inLanguage: 'fr-BJ',
    numberOfItems: organizers.length,
    itemListElement: organizers.map((organizer, index) => ({
      '@type': 'ListItem',
      position: (requestedPage - 1) * pageSize + index + 1,
      url: `${SITE}/organizers/${organizer.slug}`,
      name: organizer.publicName,
      item: {
        '@type': 'Organization',
        '@id': `${SITE}/organizers/${organizer.slug}`,
        name: organizer.publicName,
        url: `${SITE}/organizers/${organizer.slug}`,
        address: organizer.city || organizer.country ? {
          '@type': 'PostalAddress',
          addressLocality: organizer.city,
          addressCountry: organizer.country || 'BJ',
        } : undefined,
      },
    })),
  }

  function makeHref(page: number) {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (sort !== 'popular') params.set('sort', sort)
    if (page > 1) params.set('page', String(page))
    const query = params.toString()
    return query ? `/organizers?${query}` : '/organizers'
  }

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd).replace(/</g, '\\u003c') }} />
      <section className={styles.hero} aria-labelledby="organizers-title">
        <h1 id="organizers-title">Suivez celles et ceux qui créent l’émotion.</h1>
        <p className={styles.intro}>Découvrez leur univers, suivez leur actualité et retrouvez leurs prochains rendez-vous.</p>

        <UnifiedSearchBar
          actionUrl="/organizers"
          placeholder="Nom, ville ou événement"
          defaultValue={search}
          extraParams={sort !== 'popular' ? { sort } : {}}
        />
      </section>

      <section className={styles.directory} aria-labelledby="organizer-directory-title">
        <div className={styles.directoryHeader}>
          <div><p className={styles.sectionKicker}><SlidersHorizontal size={18} aria-hidden="true" /> Explorer</p><h2 id="organizer-directory-title">Tous les organisateurs</h2></div>
          <p className={styles.resultCount}>{total} profil{total > 1 ? 's' : ''}</p>
        </div>

        {hasFilters && <div className={styles.activeFilters}><p>Résultats selon vos critères · périmètre Bénin</p><Link href="/organizers"><X size={17} aria-hidden="true" /> Effacer les filtres</Link></div>}

        {organizers.length > 0 ? (
          <div className={styles.grid}>
            {organizers.map((organizer, index) => {
              const zones = getEntityRegionIds(organizer).map(getRegionName).filter(Boolean)
              const isSelf = session?.user?.id === organizer.userId
              return (
                <article key={organizer.userId} className={styles.card}>
                  <Link href={`/organizers/${organizer.slug}`} className={styles.cardLink} aria-label={`Découvrir ${organizer.publicName}`}>
                    <div className={styles.visual}>
                      <Image src={reliablePhotoUrl(organizer.bannerUrl, organizer.userId, 900, 560)} alt="" fill loading={index < 4 ? 'eager' : undefined} className={styles.cover} sizes="(max-width:680px) calc(100vw - 40px), (max-width:1020px) 46vw, (max-width:1440px) 24vw, 210px" />
                      <div className={styles.scrim} />
                      <div className={styles.avatar}>{organizer.avatarUrl ? <Image src={organizer.avatarUrl} alt="" fill sizes="44px" /> : organizer.publicName?.[0]?.toUpperCase()}</div>
                    </div>
                    <div className={styles.cardBody}>
                      <p className={styles.category}>Organisateur</p>
                      <h3>{organizer.publicName}</h3>
                      <div className={styles.meta}>
                        {(organizer.city || zones.length > 0) && <span><MapPin size={18} aria-hidden="true" />{[organizer.city, ...zones].filter(Boolean).slice(0, 2).join(' · ')}</span>}
                        <span><Users size={18} aria-hidden="true" />{organizer.followersCount || 0} abonné{(organizer.followersCount || 0) > 1 ? 's' : ''}</span>
                      </div>
                      <div className={styles.footer}>
                        <span className={styles.footerText}>{organizer.nextEvent ? organizer.nextEvent.name : 'Voir la programmation'}</span>
                        <span className={styles.discover}>Découvrir <ArrowUpRight size={18} aria-hidden="true" /></span>
                      </div>
                    </div>
                  </Link>
                  {!isSelf && <div className={styles.follow}><OrganizerFollowButtonClient organizerId={organizer.userId} organizerName={organizer.publicName} initialFollowing={followedIds.has(organizer.userId)} isAuthenticated={Boolean(session?.user)} appearance="premium" /></div>}
                </article>
              )
            })}
          </div>
        ) : (
          <div className={styles.empty}><Mascot mood="search" size={250} /><h3>Aucun organisateur trouvé</h3><p>Essayez une autre recherche dans le catalogue Bénin.</p><Link href="/organizers">Voir tous les organisateurs</Link></div>
        )}

        <PageLinks page={requestedPage} pageCount={totalPages} makeHref={makeHref} totalItems={total} pageSize={pageSize} />
      </section>
    </main>
  )
}
