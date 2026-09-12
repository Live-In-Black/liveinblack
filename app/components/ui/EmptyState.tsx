import type { ReactNode } from 'react'
import Image from 'next/image'
import styles from './EmptyState.module.css'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  eyebrow?: string
  tag?: string
  imageSrc?: string
  className?: string
}

export default function EmptyState({
  title,
  description,
  action,
  eyebrow = 'Aucun résultat',
  tag = 'LIVEINBLACK',
  imageSrc = '/images/live-in-black/night-benin/night-benin-hero.png',
  className,
}: EmptyStateProps) {
  return (
    <div className={`${styles.emptyCard} ${className || ''}`}>
      <div className={styles.emptyVisual} aria-hidden="true">
        <Image
          src={imageSrc}
          alt=""
          fill
          className={styles.emptyImage}
          sizes="(max-width: 768px) 100vw, 36vw"
        />
        {tag && <span className={styles.emptyTag}>{tag}</span>}
      </div>
      <div className={styles.emptyContent}>
        {eyebrow && <p className={styles.emptyEyebrow}>{eyebrow}</p>}
        <h3>{title}</h3>
        {description && <p className={styles.emptyDescription}>{description}</p>}
        {action && <div className={styles.emptyAction}>{action}</div>}
      </div>
    </div>
  )
}
