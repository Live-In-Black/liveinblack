// Visuels de secours réels libres de droits (Unsplash) pour les événements sans photo.
// Le choix reste déterministe afin qu'une même fiche garde la même identité.
const NIGHTLIFE_PHOTOS = [
  '/images/live-in-black/night-benin/night-benin-hero.png',
  '/images/live-in-black/night-benin/night-benin-concert.png',
  '/images/live-in-black/night-benin/night-benin-dancefloor.png',
  '/images/live-in-black/night-benin/night-benin-rooftop.png',
  '/images/live-in-black/night-benin/night-benin-lounge.png',
  '/images/live-in-black/night-benin/night-benin-organizer.png',
  '/images/live-in-black/night-benin/night-benin-dj.png',
  '/images/live-in-black/night-benin/night-benin-rooftop.png',
]

// Identifiants d'images distantes réellement cassées ou inaccessibles.
const BROKEN_REMOTE_PHOTO_IDS = ['1571266028243-e4bb35fd2ca6']
const LEGACY_DEMO_PHOTO_HOSTS: string[] = []

function hashSeed(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h
}

export function placeholderPhotoUrl(seed: string, w = 1200, h = 500): string {
  void w
  void h
  return NIGHTLIFE_PHOTOS[hashSeed(seed) % NIGHTLIFE_PHOTOS.length]
}

export function reliablePhotoUrl(url: string | null | undefined, seed: string, w = 1200, h = 500, fallbackUrl?: string): string {
  const candidate = url?.trim()
  if (!candidate || BROKEN_REMOTE_PHOTO_IDS.some((id) => candidate.includes(id)) || LEGACY_DEMO_PHOTO_HOSTS.some((host) => candidate.includes(host))) {
    return fallbackUrl || placeholderPhotoUrl(seed, w, h)
  }
  return candidate
}
