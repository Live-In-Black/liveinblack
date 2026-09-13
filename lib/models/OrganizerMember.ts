import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

export const ORGANIZER_PERMISSIONS = [
  'scan',           // Scanner les billets à l'entrée
  'sales',          // Réaliser des ventes de tickets sur place
  'events_view',    // Consulter les événements de l'organisateur
  'events_edit',    // Modifier / éditer les événements
  'stats_view',     // Accéder aux rapports statistiques et analytiques
  'finances_view',  // Voir les encaissements et finances
] as const

export type OrganizerPermissionKey = (typeof ORGANIZER_PERMISSIONS)[number]

const organizerMemberSchema = new Schema(
  {
    organizerId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    displayName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    roleTitle: { type: String, default: 'Agent de terrain' }, // ex: "Contrôleur entrée", "Vendeur", "Assistant manager"
    permissions: { type: [String], enum: ORGANIZER_PERMISSIONS, default: ['scan', 'sales'] },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    assignedEventIds: { type: [String], default: [] }, // vide = tous les événements ou global
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
)

organizerMemberSchema.index({ organizerId: 1, userId: 1 }, { unique: true })
organizerMemberSchema.index({ organizerId: 1, status: 1 })

export type OrganizerMemberDoc = InferSchemaType<typeof organizerMemberSchema>
export type OrganizerMemberModel = Model<OrganizerMemberDoc>

export default (models.OrganizerMember as OrganizerMemberModel) ||
  model<OrganizerMemberDoc>('OrganizerMember', organizerMemberSchema)
