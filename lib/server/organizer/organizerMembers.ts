import { getDb } from '@/lib/db/mongoose'
import OrganizerMember, { type OrganizerPermissionKey, ORGANIZER_PERMISSIONS } from '@/lib/models/OrganizerMember'
import User from '@/lib/models/User'
import Event from '@/lib/models/Event'
import Ticket from '@/lib/models/Ticket'
import Order from '@/lib/models/Order'
import bcrypt from 'bcryptjs'

export interface MemberCaller {
  id: string
}

export interface OrganizerMemberView {
  id: string
  userId: string
  displayName: string
  email: string
  roleTitle: string
  permissions: OrganizerPermissionKey[]
  status: 'active' | 'suspended'
  assignedEventIds: string[]
  createdAt: string
  initialPassword?: string
  stats?: {
    scansCount: number
    salesCount: number
  }
}

export async function listOrganizerMembers(caller: MemberCaller): Promise<{ ok: true; members: OrganizerMemberView[] } | { ok: false; status: number; error: string }> {
  await getDb()
  const members = await OrganizerMember.find({ organizerId: caller.id }).sort({ createdAt: -1 }).lean()
  if (members.length === 0) return { ok: true, members: [] }

  const userIds = members.map((m) => m.userId)

  // Activité des agents : scans validés et ventes guichet réalisées
  const [scanCounts, saleCounts] = await Promise.all([
    Ticket.aggregate([
      { $match: { checkedInBy: { $in: userIds } } },
      { $group: { _id: '$checkedInBy', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { agentUid: { $in: userIds }, status: 'paid' } },
      { $group: { _id: '$agentUid', count: { $sum: 1 } } },
    ]),
  ])

  const scanMap = new Map<string, number>(scanCounts.map((r: { _id: unknown; count: number }) => [String(r._id), Number(r.count) || 0]))
  const saleMap = new Map<string, number>(saleCounts.map((r: { _id: unknown; count: number }) => [String(r._id), Number(r.count) || 0]))

  return {
    ok: true,
    members: members.map((m) => ({
      id: String(m._id),
      userId: m.userId,
      displayName: m.displayName,
      email: m.email,
      roleTitle: m.roleTitle,
      permissions: m.permissions as OrganizerPermissionKey[],
      status: m.status as 'active' | 'suspended',
      assignedEventIds: m.assignedEventIds,
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : '',
      stats: {
        scansCount: scanMap.get(m.userId) || 0,
        salesCount: saleMap.get(m.userId) || 0,
      },
    })),
  }
}

export async function createOrganizerMember(
  caller: MemberCaller,
  input: {
    displayName: string
    email: string
    password?: string
    roleTitle?: string
    permissions: OrganizerPermissionKey[]
    assignedEventIds?: string[]
  }
): Promise<{ ok: true; member: OrganizerMemberView } | { ok: false; status: number; error: string }> {
  await getDb()

  const cleanEmail = input.email.trim().toLowerCase()
  const cleanName = input.displayName.trim()
  if (!cleanEmail || !cleanName) {
    return { ok: false, status: 400, error: 'missing_required_fields' }
  }

  // Vérifier si un compte User existe déjà
  let targetUser = await User.findOne({ email: cleanEmail })
  const providedPassword = input.password?.trim() || Math.random().toString(36).slice(-8) + 'A1!'

  if (!targetUser) {
    // Création automatique du sous-compte
    const passwordHash = await bcrypt.hash(providedPassword, 10)

    const [first, ...rest] = cleanName.split(' ')
    targetUser = await User.create({
      email: cleanEmail,
      passwordHash,
      firstName: first || 'Agent',
      lastName: rest.join(' ') || '',
      roles: ['client'],
      activeRole: 'client',
      status: 'active',
      emailVerifiedAt: new Date(),
    })
  }

  // Vérifier si déjà membre de cette organisation
  const existing = await OrganizerMember.findOne({
    organizerId: caller.id,
    userId: String(targetUser._id),
  })

  if (existing) {
    return { ok: false, status: 409, error: 'already_member' }
  }

  const validPerms = (input.permissions || []).filter((p) =>
    ORGANIZER_PERMISSIONS.includes(p)
  )

  const doc = await OrganizerMember.create({
    organizerId: caller.id,
    userId: String(targetUser._id),
    displayName: cleanName,
    email: cleanEmail,
    roleTitle: input.roleTitle?.trim() || 'Agent de terrain',
    permissions: validPerms.length > 0 ? validPerms : ['scan', 'sales'],
    assignedEventIds: input.assignedEventIds || [],
    createdBy: caller.id,
  })

  return {
    ok: true,
    member: {
      id: String(doc._id),
      userId: doc.userId,
      displayName: doc.displayName,
      email: doc.email,
      roleTitle: doc.roleTitle,
      permissions: doc.permissions as OrganizerPermissionKey[],
      status: doc.status as 'active' | 'suspended',
      assignedEventIds: doc.assignedEventIds,
      createdAt: doc.createdAt.toISOString(),
      initialPassword: providedPassword,
      stats: {
        scansCount: 0,
        salesCount: 0,
      },
    },
  }
}

export async function updateOrganizerMember(
  caller: MemberCaller,
  memberId: string,
  input: {
    roleTitle?: string
    permissions?: OrganizerPermissionKey[]
    status?: 'active' | 'suspended'
    assignedEventIds?: string[]
  }
): Promise<{ ok: true; member: OrganizerMemberView } | { ok: false; status: number; error: string }> {
  await getDb()

  const doc = await OrganizerMember.findOne({ _id: memberId, organizerId: caller.id })
  if (!doc) return { ok: false, status: 404, error: 'member_not_found' }

  if (input.roleTitle !== undefined) doc.roleTitle = input.roleTitle.trim()
  if (input.permissions !== undefined) {
    doc.permissions = input.permissions.filter((p) => ORGANIZER_PERMISSIONS.includes(p))
  }
  if (input.status !== undefined) doc.status = input.status
  if (input.assignedEventIds !== undefined) doc.assignedEventIds = input.assignedEventIds

  await doc.save()

  return {
    ok: true,
    member: {
      id: String(doc._id),
      userId: doc.userId,
      displayName: doc.displayName,
      email: doc.email,
      roleTitle: doc.roleTitle,
      permissions: doc.permissions as OrganizerPermissionKey[],
      status: doc.status as 'active' | 'suspended',
      assignedEventIds: doc.assignedEventIds,
      createdAt: doc.createdAt.toISOString(),
    },
  }
}

export async function deleteOrganizerMember(
  caller: MemberCaller,
  memberId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  await getDb()
  const res = await OrganizerMember.deleteOne({ _id: memberId, organizerId: caller.id })
  if (res.deletedCount === 0) return { ok: false, status: 404, error: 'member_not_found' }
  return { ok: true }
}

export async function getMemberOrganizerPermissions(
  userId: string
): Promise<{ isMember: boolean; memberships: OrganizerMemberView[] }> {
  await getDb()
  const docs = await OrganizerMember.find({ userId, status: 'active' }).lean()
  if (!docs.length) return { isMember: false, memberships: [] }

  return {
    isMember: true,
    memberships: docs.map((m) => ({
      id: String(m._id),
      userId: m.userId,
      displayName: m.displayName,
      email: m.email,
      roleTitle: m.roleTitle,
      permissions: m.permissions as OrganizerPermissionKey[],
      status: m.status as 'active' | 'suspended',
      assignedEventIds: m.assignedEventIds,
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : '',
    })),
  }
}
