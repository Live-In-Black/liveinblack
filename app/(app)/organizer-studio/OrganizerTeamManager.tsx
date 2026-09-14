'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Input, Label, Modal } from '@/app/components/ui'
import {
  Plus,
  Shield,
  Trash2,
  Edit2,
  Check,
  UserCheck,
  QrCode,
  ShoppingCart,
  Calendar,
  BarChart3,
  Copy,
  Layers,
} from 'lucide-react'
import type { OrganizerMemberView } from '@/lib/server/organizer/organizerMembers'
import type { OrganizerPermissionKey } from '@/lib/models/OrganizerMember'

const PERMISSION_DEFINITIONS: {
  key: OrganizerPermissionKey
  label: string
  desc: string
  icon: typeof QrCode
}[] = [
  {
    key: 'scan',
    label: 'Contrôle entrée & QR Code',
    desc: 'Scanner les billets à l’entrée avec le lecteur caméra.',
    icon: QrCode,
  },
  {
    key: 'sales',
    label: 'Vente sur place (Guichet)',
    desc: 'Vendre des tickets physiques ou cash/Mobile Money à la porte.',
    icon: ShoppingCart,
  },
  {
    key: 'events_view',
    label: 'Consultation événements',
    desc: 'Accéder aux listes des soirées et détails d’organisation.',
    icon: Calendar,
  },
  {
    key: 'events_edit',
    label: 'Édition & Gestion des soirées',
    desc: 'Modifier les informations, programmes et jauges.',
    icon: Edit2,
  },
  {
    key: 'stats_view',
    label: 'Statistiques & Rapports',
    desc: 'Consulter les métriques de vente et jauges d’affluence.',
    icon: BarChart3,
  },
  {
    key: 'finances_view',
    label: 'Accès Finances & Encaissements',
    desc: 'Voir les récapitulatifs de caisse et billetterie.',
    icon: Shield,
  },
]

interface EventOption {
  id: string
  name: string
  dateDisplay?: string
  date?: string
}

export default function OrganizerTeamManager() {
  const [members, setMembers] = useState<OrganizerMemberView[]>([])
  const [events, setEvents] = useState<EventOption[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<OrganizerMemberView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Credentials dialog after creation
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password?: string; name: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Form states
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleTitle, setRoleTitle] = useState('Membre terrain')
  const [permissions, setPermissions] = useState<OrganizerPermissionKey[]>(['scan', 'sales'])
  const [assignedEventIds, setAssignedEventIds] = useState<string[]>([])
  const [allEventsAccess, setAllEventsAccess] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const [membersRes, eventsRes] = await Promise.all([
        fetch('/api/organizer-members'),
        fetch('/api/organizer-events'),
      ])
      const membersData = await membersRes.json()
      const eventsData = await eventsRes.json()
      if (membersRes.ok && membersData.ok) {
        setMembers(membersData.members)
      }
      if (eventsRes.ok && eventsData.ok && Array.isArray(eventsData.events)) {
        setEvents(eventsData.events.map((e: { id: string; name: string; dateDisplay?: string; date?: string }) => ({
          id: e.id,
          name: e.name,
          dateDisplay: e.dateDisplay || e.date || '',
        })))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [])

  function openCreateModal() {
    setEditingMember(null)
    setDisplayName('')
    setEmail('')
    setPassword('')
    setRoleTitle('Membre terrain')
    setPermissions(['scan', 'sales'])
    setAssignedEventIds([])
    setAllEventsAccess(true)
    setError(null)
    setModalOpen(true)
  }

  function openEditModal(m: OrganizerMemberView) {
    setEditingMember(m)
    setDisplayName(m.displayName)
    setEmail(m.email)
    setPassword('')
    setRoleTitle(m.roleTitle)
    setPermissions(m.permissions)
    const hasSpecific = (m.assignedEventIds || []).length > 0
    setAssignedEventIds(m.assignedEventIds || [])
    setAllEventsAccess(!hasSpecific)
    setError(null)
    setModalOpen(true)
  }

  function togglePermission(key: OrganizerPermissionKey) {
    setPermissions((curr) =>
      curr.includes(key) ? curr.filter((p) => p !== key) : [...curr, key]
    )
  }

  function toggleAssignedEvent(eventId: string) {
    setAssignedEventIds((curr) =>
      curr.includes(eventId) ? curr.filter((id) => id !== eventId) : [...curr, eventId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const finalAssignedEventIds = allEventsAccess ? [] : assignedEventIds

      if (editingMember) {
        const res = await fetch(`/api/organizer-members/${editingMember.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roleTitle,
            permissions,
            assignedEventIds: finalAssignedEventIds,
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'update_failed')
        setSuccess('Permissions mises à jour avec succès.')
        setModalOpen(false)
      } else {
        const res = await fetch('/api/organizer-members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName,
            email,
            password: password || undefined,
            roleTitle,
            permissions,
            assignedEventIds: finalAssignedEventIds,
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          if (data.error === 'already_member') {
            throw new Error('Cet utilisateur fait déjà partie de votre équipe.')
          }
          throw new Error(data.error || 'creation_failed')
        }
        setSuccess('Accès d’équipe créé avec succès.')
        setModalOpen(false)
        // Afficher les identifiants pour transmission
        setCreatedCredentials({
          name: displayName,
          email,
          password: data.member?.initialPassword || password || 'Généré automatiquement',
        })
      }
      loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(m: OrganizerMemberView) {
    if (!window.confirm(`Supprimer l’accès pour ${m.displayName} (${m.email}) ?`)) return
    try {
      const res = await fetch(`/api/organizer-members/${m.id}`, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Accès révoqué.')
        loadData()
      }
    } catch {
      // ignore
    }
  }

  function copyCredentials() {
    if (!createdCredentials) return
    const text = `Identifiants LIVEINBLACK :\nNom : ${createdCredentials.name}\nEmail : ${createdCredentials.email}\nMot de passe : ${createdCredentials.password}\nConnexion sur : ${window.location.origin}/login`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {success && (
        <div
          role="status"
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(var(--primary-rgb), 0.12)',
            border: '1px solid rgba(var(--primary-rgb), 0.3)',
            color: 'var(--primary)',
            fontSize: 'var(--font-size-callout)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Modal d'affichage des identifiants créés */}
      {createdCredentials && (
        <Modal
          title="Identifiants d’accès créés"
          onClose={() => setCreatedCredentials(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Collaborateur</span>
                <strong style={{ color: 'var(--text)', fontSize: 13 }}>{createdCredentials.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email de connexion</span>
                <strong style={{ color: 'var(--primary)', fontSize: 13 }}>{createdCredentials.email}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mot de passe</span>
                <code
                  style={{
                    background: 'var(--surface)',
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {createdCredentials.password}
                </code>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.5 }}>
              Transmettez ces identifiants au membre de votre équipe. Il pourra se connecter sur LIVEINBLACK avec son email et ce mot de passe, et aura directement accès aux outils autorisés (scan des billets, vente guichet, etc.).
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <Button
                variant="secondary"
                onClick={copyCredentials}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copié dans le presse-papier !' : 'Copier les identifiants'}</span>
              </Button>
              <Button variant="primary" onClick={() => setCreatedCredentials(null)}>
                Terminer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <Card style={{ padding: '24px', borderRadius: 'var(--radius-card)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-title-4)', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              Gestion des Agents & Équipe de terrain
            </h2>
            <p style={{ fontSize: 'var(--font-size-footnote)', color: 'var(--text-muted)', margin: '4px 0 0', maxWidth: 680 }}>
              Ajoutez les membres de votre équipe terrain et définissez précisément leurs permissions d&rsquo;accès (scan, guichet, consultation, etc.) sans donner accès à votre compte principal.
            </p>
          </div>
          <Button variant="primary" onClick={openCreateModal} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} />
            <span>Ajouter un membre</span>
          </Button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chargement de l’équipe…</p>
        ) : members.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 14, background: 'var(--surface-2)' }}>
            <UserCheck size={36} style={{ color: 'var(--text-faint)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 'var(--font-size-body)', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }}>
              Aucun agent ou collaborateur configuré
            </p>
            <p style={{ fontSize: 'var(--font-size-footnote)', color: 'var(--text-muted)', margin: '0 0 16px', maxWidth: 460, marginInline: 'auto' }}>
              Ajoutez vos collaborateurs pour leur déléguer le contrôle des billets ou la billetterie sur place en toute sécurité.
            </p>
            <Button variant="secondary" onClick={openCreateModal}>
              Créer votre premier agent
            </Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {members.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  flexWrap: 'wrap',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 220 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'var(--primary-a14)',
                      color: 'var(--primary)',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 700,
                      fontSize: 16,
                    }}
                  >
                    {m.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 'var(--font-size-body)', fontWeight: 600, color: 'var(--text)' }}>
                      {m.displayName}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-footnote)', color: 'var(--text-muted)' }}>
                      {m.email} · <strong style={{ color: 'var(--primary)' }}>{m.roleTitle}</strong>
                    </p>
                  </div>
                </div>

                {/* Badges de permissions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1, minWidth: 260 }}>
                  {m.permissions.map((p) => {
                    const def = PERMISSION_DEFINITIONS.find((d) => d.key === p)
                    return (
                      <span
                        key={p}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 8,
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                        }}
                      >
                        {def?.icon && <def.icon size={12} style={{ color: 'var(--primary)' }} />}
                        <span>{def?.label || p}</span>
                      </span>
                    )
                  })}
                  {m.assignedEventIds && m.assignedEventIds.length > 0 ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 8,
                        background: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#3b82f6',
                      }}
                    >
                      <Layers size={12} />
                      <span>{m.assignedEventIds.length} soirée{m.assignedEventIds.length > 1 ? 's' : ''}</span>
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 8,
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                      }}
                    >
                      <Layers size={12} />
                      <span>Toutes les soirées</span>
                    </span>
                  )}
                </div>

                {/* Activité terrain */}
                {m.stats && (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', fontSize: 11 }}>
                      <span style={{ display: 'block', fontWeight: 800, color: 'var(--text)' }}>
                        {m.stats.scansCount}
                      </span>
                      <span style={{ color: 'var(--text-faint)' }}>Scans</span>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: 11 }}>
                      <span style={{ display: 'block', fontWeight: 800, color: 'var(--text)' }}>
                        {m.stats.salesCount}
                      </span>
                      <span style={{ color: 'var(--text-faint)' }}>Ventes</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Button variant="secondary" size="sm" onClick={() => openEditModal(m)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Edit2 size={14} />
                    <span>Modifier</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(m)} style={{ color: 'var(--danger)', padding: 8 }}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal création / édition */}
      {modalOpen && (
        <Modal
          title={editingMember ? 'Modifier les accès du membre' : 'Ajouter un membre d’équipe'}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--danger-fill)', color: 'var(--danger)', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="mem-name">Nom complet ou pseudonyme</Label>
              <Input
                id="mem-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Jean Agent Cotonou"
                required
              />
            </div>

            <div>
              <Label htmlFor="mem-email">Adresse e-mail de connexion</Label>
              <Input
                id="mem-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@liveinblack.com"
                disabled={!!editingMember}
                required
              />
            </div>

            {!editingMember && (
              <div>
                <Label htmlFor="mem-pwd">Mot de passe temporaire (optionnel)</Label>
                <Input
                  id="mem-pwd"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Laisser vide pour générer automatiquement"
                />
              </div>
            )}

            <div>
              <Label htmlFor="mem-role">Rôle / Intitulé du poste</Label>
              <Input
                id="mem-role"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="Ex: Contrôleur VIP, Caissier Porte A, etc."
                required
              />
            </div>

            {/* Périmètre d'affectation aux événements */}
            {events.length > 0 && (
              <div>
                <Label>Périmètre d’affectation aux événements</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                    <input
                      type="radio"
                      name="allEvents"
                      checked={allEventsAccess}
                      onChange={() => setAllEventsAccess(true)}
                    />
                    <span>Accès à <strong>tous les événements</strong> de l&rsquo;organisation</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                    <input
                      type="radio"
                      name="allEvents"
                      checked={!allEventsAccess}
                      onChange={() => setAllEventsAccess(false)}
                    />
                    <span>Limiter à <strong>certaines soirées spécifiques</strong></span>
                  </label>

                  {!allEventsAccess && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 6, marginTop: 6, maxHeight: 160, overflowY: 'auto', padding: 6, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-2)' }}>
                      {events.map((ev) => {
                        const checked = assignedEventIds.includes(ev.id)
                        return (
                          <div
                            key={ev.id}
                            onClick={() => toggleAssignedEvent(ev.id)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 8,
                              background: checked ? 'var(--primary-a10)' : 'var(--surface)',
                              border: `1px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: 4,
                                border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--text-faint)'}`,
                                background: checked ? 'var(--primary)' : 'transparent',
                                color: '#fff',
                                display: 'grid',
                                placeItems: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {checked && <Check size={11} strokeWidth={3} />}
                            </div>
                            <span style={{ color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ev.name}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label>Permissions attribuées à l’agent</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginTop: 6 }}>
                {PERMISSION_DEFINITIONS.map((def) => {
                  const active = permissions.includes(def.key)
                  return (
                    <div
                      key={def.key}
                      onClick={() => togglePermission(def.key)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                        background: active ? 'var(--primary-a10)' : 'var(--surface-2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        transition: 'all .16s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          border: `1.5px solid ${active ? 'var(--primary)' : 'var(--text-faint)'}`,
                          background: active ? 'var(--primary)' : 'transparent',
                          color: '#fff',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        {active && <Check size={13} strokeWidth={3} />}
                      </div>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block' }}>
                          {def.label}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3, display: 'block', marginTop: 2 }}>
                          {def.desc}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {editingMember ? 'Enregistrer les modifications' : 'Créer l’accès'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
