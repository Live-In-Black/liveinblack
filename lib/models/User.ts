import mongoose, { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

// Remplace `users/{uid}` (Firestore) + Firebase Auth. Les comptes client,
// organisateur et prestataire sont désormais des comptes séparés, chacun avec
// un seul type et une adresse e-mail unique. `roles` reste un tableau pour
// compatibilité avec les anciens documents et pour la permission agent, mais
// les nouvelles créations ne portent qu'un rôle métier.
export const ROLES = ['client', 'organisateur', 'prestataire', 'agent'] as const
const STATUSES = ['active', 'pending', 'rejected'] as const
const ROLE_APPROVAL_STATUSES = ['none', 'pending', 'active', 'rejected'] as const

// Confidentialité (#6 phase profil, port de la section "Confidentialité" de
// ProfilePage.jsx) — toutes à true par défaut, comme le legacy. `showOnline`
// est réellement appliqué par lib/server/presence.ts (getPresence masque le
// statut d'un compte qui l'a désactivé) et `readReceipts` par
// lib/server/messaging.ts (un accusé de lecture n'est exposé aux AUTRES que
// si son auteur a cette préférence active). `showAvatar` et
// `personalizedRecommendations` pilote réellement le moteur de /events.
// `showAvatar` reste la règle de visibilité à appliquer à toute future vue
// sociale qui expose l'avatar personnel (les vues actuelles utilisent des
// initiales ou les médias publics des profils professionnels).
const privacySchema = new Schema(
  {
    showOnline: { type: Boolean, default: true },
    showAvatar: { type: Boolean, default: true },
    readReceipts: { type: Boolean, default: true },
    personalizedRecommendations: { type: Boolean, default: true },
  },
  { _id: false }
)

export const NAME_COOLDOWN_DAYS = 14

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    phone: { type: String, default: '' },
    avatarUrl: { type: String, default: null },
    // Démographie facultative — jamais affichée sur un profil, jamais un
    // contrôle d'âge (voir le hint exact du legacy dans ProfilePage.jsx) :
    // sert uniquement aux statistiques anonymes côté organisateur.
    birthDate: { type: Date, default: null },
    birthYear: { type: Number, default: null },
    gender: { type: String, enum: ['femme', 'homme', 'autre'], default: null },
    // Cooldown de 14 jours entre deux changements de nom (NAME_COOLDOWN_MS
    // côté legacy) — voir lib/server/profile.ts:updateName.
    nameChangedAt: { type: Date, default: null },
    // Changement d'email en attente de confirmation (verifyBeforeUpdateEmail
    // côté legacy) — `email` ne change qu'à la confirmation du lien envoyé à
    // CETTE adresse, jamais immédiatement à la demande. Voir
    // lib/server/profile.ts : requestEmailChange / confirmEmailChange.
    pendingEmail: { type: String, default: null },
    privacy: { type: privacySchema, default: () => ({}) },
    // Goûts déclarés (carte "Mes goûts", #6 phase profil) — forme libre
    // (musicStyles[]/artists[]/eventTypes[]/cities[]/budget/ambiances[]/...),
    // consommée par le moteur de recommandation de /events.
    preferences: { type: mongoose.Schema.Types.Mixed, default: null },
    roles: { type: [String], enum: ROLES, default: ['client'] },
    activeRole: { type: String, enum: ROLES, default: 'client' },
    status: { type: String, enum: STATUSES, default: 'active' },
    // Statut de validation propre au compte professionnel — distinct du
    // `status` global ci-dessus. Les comptes organisateur et prestataire sont
    // indépendants ; ces deux champs ne servent pas à ajouter un second rôle
    // au compte courant.
    orgStatus: { type: String, enum: ROLE_APPROVAL_STATUSES, default: 'none' },
    prestStatus: { type: String, enum: ROLE_APPROVAL_STATUSES, default: 'none' },
    emailVerifiedAt: { type: Date, default: null },
    points: { type: Number, default: 0 },
    lastSeenAt: { type: Date, default: null },
    superAdmin: { type: Boolean, default: false },
    // Suspension par un agent (#9 phase agent/admin, port de l'action Firebase
    // Auth `set_disabled` de api/admin-accounts.js) — bloque uniquement la
    // connexion (voir auth.ts:authorize), distinct du `status` d'approbation
    // ci-dessus qui n'a pas de valeur 'banned' dans ce port.
    disabled: { type: Boolean, default: false },

    // Bumped whenever `disabled` is set to true or the account is anonymisé
    // (auto-suppression cliente, suppression validée par un agent) — auth.ts
    // compare cette valeur à celle gravée dans le JWT pour révoquer une
    // session déjà émise (une stratégie JWT ne revalide sinon jamais le
    // compte en base entre deux connexions, cf. audit pré-bascule).
    sessionVersion: { type: Number, default: 0 },

    // Empreintes (hash IP+UA, jamais en clair) des appareils déjà vus à la
    // connexion — permet à auth.ts d'envoyer l'email "nouvelle connexion"
    // (E16) uniquement pour un appareil vraiment inconnu. Plafonné à 10,
    // le plus ancien tombe à chaque nouvel ajout (voir $push/$slice dans
    // auth.ts) — ce n'est pas un mécanisme de sécurité fort (pas de MFA),
    // juste une alerte best-effort comme le reste des emails E1-E64.
    knownDeviceHashes: { type: [String], default: [] },

    // Abonnements Web Push (navigateur) — un par appareil/navigateur ayant
    // accepté les notifications push. Plafonné à 5 (voir $push/$slice dans
    // app/api/push/subscribe/route.ts) pour éviter une croissance illimitée
    // si l'utilisateur active la fonctionnalité sur beaucoup d'appareils.
    // Une entrée invalide (410 Gone côté navigateur) est retirée
    // automatiquement par lib/server/push.ts au premier envoi en échec.
    pushSubscriptions: {
      type: [
        {
          endpoint: { type: String, required: true },
          p256dh: { type: String, required: true },
          auth: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    // Stripe Connect historique (anciens comptes organisateurs). Le lancement
    // actif au Bénin utilise les versements FedaPay ci-dessous.
    // Écrit UNIQUEMENT par le webhook `account.updated`, jamais par le client.
    stripeAccountId: { type: String, default: null },
    stripeChargesEnabled: { type: Boolean, default: false },
    stripeCountry: { type: String, default: null },

    // Numéros mobile money pour les versements FedaPay, par code pays ISO-2.
    // Le lancement actif ne propose que le code Bénin `bj`.
    payoutMomos: { type: Map, of: String, default: {} },

    // Référence du sous-compte vendeur FedaPay Marketplace. Pour le lancement
    // Bénin, elle est obligatoire avant publication afin que FedaPay répartisse
    // immédiatement la part organisateur au paiement.
    fedapaySubAccountReference: { type: String, default: null },

    // Comptes bloqués par CE compte — le blocage empêche l'envoi de messages
    // dans les deux sens, voir lib/server/messaging.ts.
    blockedUserIds: { type: [String], default: [] },

    // Abonnement prestataire (#8 phase prestataire) — miroir de compte du
    // statut réellement détenu par `ProviderProfile` (source de vérité, voir
    // lib/models/ProviderProfile.ts), nécessaire pour les gates qui ne
    // chargent que `User`. `stripeCustomerId`/`stripeSubscriptionId` ne
    // subsistent que pour annuler/nettoyer d'anciens abonnements externes lors
    // d'une suppression de compte ; la V1 active est FedaPay/XOF.
    prestataireSubActive: { type: Boolean, default: false },
    prestataireSubStatus: { type: String, default: null },
    prestataireSubEnd: { type: Date, default: null },
    prestataireSubRail: { type: String, enum: ['stripe', 'fedapay', null], default: null },
    stripeSubscriptionId: { type: String, default: null },
    stripeCustomerId: { type: String, default: null },

    // Registre léger pour le webhook FedaPay (rail XOF) : le paiement d'abonnement
    // est ponctuel (pas d'Order comme pour les billets), donc le webhook retrouve
    // le compte propriétaire via ce txnId plutôt que de faire confiance aux
    // métadonnées renvoyées par l'événement (même prudence que legacy
    // fedapay_txns, voir lib/server/providerSubscriptions.ts).
    pendingFedapaySubTxnId: { type: String, default: null },

    // Pays de FACTURATION prestataire. Le lancement actif est Bénin/XOF ; les
    // identifiants historiques restent lisibles pour les anciennes factures.
    // Remplace la collection Firestore `provider_billing/{uid}`.
    providerBillingRegionId: { type: String, default: null },
  },
  { timestamps: true }
)

userSchema.index({ firstName: 'text', lastName: 'text', email: 'text' })
userSchema.index({ lastSeenAt: -1, disabled: 1, activeRole: 1 })

export type UserDoc = InferSchemaType<typeof userSchema>
export type UserModel = Model<UserDoc>

export default (models.User as UserModel) || model<UserDoc>('User', userSchema)
