'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import styles from './home.module.css'

interface HeroSlide {
  type: 'video' | 'image'
  src: string
  poster?: string
}

const SLIDES: HeroSlide[] = [
  {
    type: 'image',
    src: '/images/live-in-black/night-benin/night-benin-hero.png',
  },
  {
    type: 'video',
    src: '/videos/nightclub-atmosphere.mp4',
    poster: '/videos/nightclub-atmosphere-poster.jpg',
  },
  {
    type: 'image',
    src: '/images/live-in-black/night-benin/night-benin-concert.png',
  },
  {
    type: 'image',
    src: '/images/live-in-black/night-benin/night-benin-rooftop.png',
  },
]

export default function HomeHeroCarousel() {
  const [active, setActive] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Si on est sur le slide vidéo, on laisse la vidéo se jouer avant de passer à la suite
    const duration = SLIDES[active].type === 'video' ? 8000 : 6000
    const timer = window.setTimeout(() => {
      setActive((current) => (current + 1) % SLIDES.length)
    }, duration)

    return () => window.clearTimeout(timer)
  }, [active])

  useEffect(() => {
    if (SLIDES[active].type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
      })
    }
  }, [active])

  return (
    <>
      <div className={styles.heroSlides} aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: -3 }}>
        {SLIDES.map((slide, index) => {
          const isActive = index === active
          if (slide.type === 'video') {
            return (
              <video
                key={slide.src}
                ref={videoRef}
                src={slide.src}
                poster={slide.poster}
                preload="none"
                autoPlay={isActive}
                muted
                playsInline
                loop={false}
                className={`${styles.heroVideo} ${isActive ? styles.heroVideoActive : ''}`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                }}
              />
            )
          }
          return (
            <Image
              key={slide.src}
              src={slide.src}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              className={`${styles.heroImage} ${isActive ? styles.heroImageActive : ''}`}
            />
          )
        })}
      </div>
      <div className={styles.heroCarouselControls} role="group" aria-label="Choisir le média du carrousel">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            className={index === active ? styles.heroCarouselDotActive : styles.heroCarouselDot}
            aria-label={`Afficher le média ${index + 1} (${slide.type === 'video' ? 'Vidéo' : 'Photo'})`}
            aria-pressed={index === active}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </>
  )
}
