'use client'

import { useState } from 'react'
import { SettingsPanel, type ProfilUser } from '../ProfilClient'
import styles from './ParametresClient.module.css'

// SettingsPanel reste défini dans ProfilClient.tsx (pas déplacé — trop de
// sous-composants privés partagés, IdentityCard/EmailCard/PasswordCard etc.,
// voir ce fichier) ; ce wrapper lui fournit uniquement l'état `user` local.
export default function ParametresClient({ initialUser }: { initialUser: ProfilUser }) {
  const [user, setUser] = useState<ProfilUser>(initialUser)
  return <div className={styles.root}><SettingsPanel user={user} setUser={setUser} /></div>
}
