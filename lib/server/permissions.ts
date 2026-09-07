// Port TypeScript de src/utils/permissions.js — chaque compte métier possède
// un seul type. Chaque fonction vérifie `activeRole`, jamais `roles`, afin de
// ne pas réactiver par inadvertance les anciens comptes multi-profils.

export type Role = 'client' | 'organisateur' | 'prestataire' | 'agent'
export type AccountStatus = 'active' | 'pending' | 'rejected'
// Statuts d'approbation conservés par champ pour les dossiers historiques;
// chaque nouveau compte n'utilise que le champ correspondant à son type.
export type RoleApprovalStatus = 'none' | 'pending' | 'active' | 'rejected'

export interface PermissionUser {
  activeRole: Role
  status: AccountStatus
  orgStatus?: RoleApprovalStatus
  prestStatus?: RoleApprovalStatus
}

function isBlockedStatus(status: AccountStatus | RoleApprovalStatus | undefined, blocked: RoleApprovalStatus[]): boolean {
  return !!status && blocked.includes(status as RoleApprovalStatus)
}

function getEffectiveApprovalStatus(user: PermissionUser, key: 'orgStatus' | 'prestStatus'): RoleApprovalStatus | AccountStatus {
  return user[key] ?? user.status
}

export function canBook(user: PermissionUser | null): boolean {
  if (!user) return false
  if (isBlockedStatus(user.status, ['pending', 'rejected'])) return false
  return user.activeRole === 'client'
}

export function canCreateEvent(user: PermissionUser | null): boolean {
  if (!user) return false
  if (user.activeRole === 'agent') return true
  if (user.activeRole !== 'organisateur') return false
  const effective = getEffectiveApprovalStatus(user, 'orgStatus')
  // 'rejected' doit bloquer au même titre que 'pending' (symétrique à
  // canProposeServices ci-dessous) — sans ce check, un organisateur dont le
  // dossier a été rejeté ou dont le compte a été suspendu par un agent (#9
  // phase agent/admin) pouvait continuer à créer des événements.
  return !isBlockedStatus(effective, ['pending', 'rejected'])
}

export function canProposeServices(user: PermissionUser | null): boolean {
  if (!user) return false
  if (user.activeRole !== 'prestataire') return false
  const effective = getEffectiveApprovalStatus(user, 'prestStatus')
  return !isBlockedStatus(effective, ['rejected'])
}

export function canOrderServices(user: PermissionUser | null): boolean {
  if (!user) return false
  return user.activeRole === 'client' || user.activeRole === 'organisateur' || user.activeRole === 'agent'
}

export function canAdminister(user: PermissionUser | null): boolean {
  if (!user) return false
  return user.activeRole === 'agent'
}

export function getBookingBlockedReason(user: PermissionUser | null): string | null {
  if (!user) return 'Connecte-toi pour réserver une place.'
  if (user.activeRole === 'organisateur') return 'Les organisateurs ne peuvent pas réserver de places. Utilise un compte client.'
  if (user.activeRole === 'prestataire') return 'Les prestataires ne peuvent pas réserver de places. Utilise un compte client.'
  if (user.activeRole === 'agent') return 'Les agents administrateurs ne peuvent pas réserver de places.'
  if (isBlockedStatus(user.status, ['pending'])) return 'Ton compte est en attente de validation.'
  if (isBlockedStatus(user.status, ['rejected'])) return 'Ton compte a été rejeté. Contacte le support.'
  return null
}

export function getCreateEventBlockedReason(user: PermissionUser | null): string | null {
  if (!user) return 'Connecte-toi avec un compte organisateur.'
  if (user.activeRole === 'client') return 'Seuls les organisateurs peuvent créer des événements.'
  if (user.activeRole === 'prestataire') return "Les prestataires ne créent pas d'événements. Passe à un compte organisateur."
  if (user.activeRole === 'organisateur') {
    const effective = getEffectiveApprovalStatus(user, 'orgStatus')
    if (isBlockedStatus(effective, ['pending'])) return 'Ton compte organisateur est en cours de validation.'
    if (isBlockedStatus(effective, ['rejected'])) return 'Ton compte a été rejeté. Contacte le support.'
  }
  return null
}

export function canViewMessaging(user: PermissionUser | null): boolean {
  return !!user
}

export function canViewWallet(user: PermissionUser | null): boolean {
  if (!user) return false
  return user.activeRole !== 'agent'
}

export function canScanTickets(user: PermissionUser | null): boolean {
  if (!user) return false
  return user.activeRole === 'organisateur' || user.activeRole === 'agent'
}

const ROLE_LABELS: Record<Role, string> = {
  client: 'Client',
  prestataire: 'Prestataire',
  organisateur: 'Organisateur',
  agent: 'Agent',
}

export function getRoleLabel(role: Role | string): string {
  return ROLE_LABELS[role as Role] || role
}
