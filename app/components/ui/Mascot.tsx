import Image from 'next/image'

export type MascotMood = 'happy' | 'confused' | 'sad' | 'sleeping' | 'search' | 'message' | 'success' | 'error'

const MASCOT_IMAGES: Record<MascotMood, string> = {
  happy: '/images/mascot/mascot-success.png',
  confused: '/images/mascot/mascot-404.png',
  sad: '/images/mascot/mascot-search.png',
  sleeping: '/images/mascot/mascot-waiting.png',
  search: '/images/mascot/mascot-search.png',
  message: '/images/mascot/mascot-message.png',
  success: '/images/mascot/mascot-success.png',
  error: '/images/mascot/mascot-error.png',
}

export default function Mascot({ mood = 'happy', size = 140 }: { mood?: MascotMood; size?: number }) {
  return (
    <div
      className="lb-mascot-image"
      data-mascot-mood={mood}
      aria-hidden="true"
      style={{ width: `min(${size}px, 100%)`, maxWidth: '100%', aspectRatio: '1 / 1', margin: '0 auto' }}
    >
      <Image
        src={MASCOT_IMAGES[mood]}
        width={720}
        height={720}
        loading="eager"
        sizes={`${size}px`}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  )
}
