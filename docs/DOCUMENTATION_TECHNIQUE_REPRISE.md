# LIVE IN BLACK Web - Documentation technique de reprise

Derniere mise a jour : 2026-09-14  
Depot concerne : `LIB_Web`  
Objectif : donner a une nouvelle equipe les reperes techniques necessaires pour continuer le developpement sans repartir de zero.

## 1. Resume executif

`LIB_Web` porte a la fois le site public, les espaces connectes, les back-offices agent/admin et l'API metier utilisee par le Web et le Mobile. Le projet est une application Next.js App Router en TypeScript, connectee a MongoDB via Mongoose et Auth.js. Les integrations majeures sont Vercel, FedaPay, Stripe, Resend, Cloudinary, Web Push et les outils d'audit/QA internes.

Le depot contient deja une documentation fonctionnelle et QA importante. Ce document sert de point d'entree technique : structure, conventions, domaines metier, commandes, tests, points de vigilance et pistes de continuation.

## 2. Stack technique

| Zone | Technologie |
|---|---|
| Framework web | Next.js `16.3.3`, App Router |
| UI | React `19.2.4`, CSS global/projet, composants React |
| Langage | TypeScript |
| Authentification | Auth.js / NextAuth `5.0.0-beta.32`, JWT/cookies |
| Base de donnees | MongoDB, Mongoose `9.7.4`, adaptateur MongoDB Auth.js |
| Paiements | Stripe, FedaPay, logique XOF/Mobile Money |
| Medias/documents | Cloudinary, signatures d'upload |
| Emails | Resend, templates centralises dans `lib/server/emails` |
| Notifications | In-app, email, Web Push/VAPID |
| Charts/analytics UI | Recharts, Vercel Analytics, Speed Insights |
| Tests | Vitest, Playwright |
| Deploiement | Vercel, `vercel.json`, scripts ops |

Attention : ce projet utilise une version recente de Next.js avec des conventions potentiellement differentes des versions plus anciennes. Avant toute modification liee au framework, lire la documentation locale dans `node_modules/next/dist/docs/`.

## 3. Structure principale du depot

```text
app/
  (public)/              Pages publiques : accueil, evenements, annuaires, auth, legal, blog
  (app)/                 Espaces connectes : dashboard, profil, messages, staff, organisateur, agent/admin
  api/                   Route Handlers Next.js, API unique du Web et du Mobile
  components/            Composants UI et composants metier reutilisables
  globals.css            Tokens globaux, theme, styles de base

lib/
  auth/                  Helpers et logique d'authentification
  client/                Helpers client navigateur et upload
  db/                    Connexion MongoDB/Mongoose
  models/                Modeles Mongoose
  server/                Services metier serveur par domaine
  shared/                Validation, constantes et logique partagee

scripts/                 Seeds, audits, migrations, checks mobile/API/ops
e2e/                     Tests Playwright, dont parcours seedes
docs/                    Documentation produit, architecture, QA, ops et suivi
config/                  Decisions et traces d'audit Vercel/ops
types/                   Extensions de types, dont NextAuth
```

## 4. Architecture applicative

L'application suit une organisation en couches :

1. Pages et composants React dans `app/`.
2. Route Handlers dans `app/api/**/route.ts`.
3. Services metier dans `lib/server/**`.
4. Modeles Mongoose dans `lib/models/**`.
5. Integrations externes depuis les services serveur.

Les routes API doivent rester fines : validation HTTP, session, appel service, reponse. Les regles metier importantes doivent vivre dans `lib/server`, pas dans les composants.

## 5. Domaines fonctionnels couverts

### Public et acquisition

- Accueil, evenements, recherche, annuaires organisateurs/prestataires.
- Blog et campagne Benin.
- Pages legales, contact, cookies.
- SEO : sitemap dynamique, feeds, scripts d'audit.

### Comptes et roles

- Comptes client, organisateur, prestataire, agent/admin.
- `activeRole` pilote l'interface et les autorisations.
- Candidatures organisateur/prestataire avec documents.
- Profil, preferences, confidentialite, export et suppression de compte.

### Evenements et billetterie

- Creation et gestion d'evenements par organisateur.
- Tarifs, places, guestlist, codes promo, staff, reporting.
- Achat, checkout, billets, QR, scan/check-in.
- Reservations de places, invitations, assignations et lifecycle des tickets.

### Paiements et remboursements

- Checkout Stripe/FedaPay selon les flux.
- FedaPay et logique XOF pour le marche Benin.
- Remboursements, preuves, contestations, destinations de paiement.
- Reversements organisateur, cash sales, alertes paiement.

### Messagerie et social

- Conversations directes/groupes.
- Messages, reactions, votes, pieces jointes, favoris, transfert, lecture.
- Presence, blocage, signalement, amis.

### Prestataires

- Candidature prestataire.
- Profil public, medias, zones, catalogue.
- Avis, reponses, signalements.
- Abonnements et billing region.

### Agent/admin

- Les routes `/admin` et `/agent` couvrent la supervision plateforme.
- Gestion utilisateurs, dossiers, evenements, paiements, avis, signalements, suppressions, blog, boosts, homepage, Vercel ops.
- Les endpoints `app/api/admin/**` et `app/api/agent/**` sont largement paralleles.

### Ops Vercel

- Audits Vercel Pro, firewall, spend, drains, webhooks, env, live gates.
- Evidence et decisions stockees dans `config/`.
- Scripts `ops:*` et `audit:vercel:*`.

## 6. API et conventions serveur

Les endpoints sont dans `app/api`. Les familles principales :

- `auth`, `account`, `profil`, `profile`
- `applications`, `organizer-members`
- `events`, `organizer-events`, `organizers`
- `checkout`, `seat-holds`, `tickets`, `event-orders`
- `refunds`, `organizer-refunds`, `refund-link`, `refund-proofs`, `refund-signatures`
- `providers`, `reviews`, `subscriptions`
- `conversations`, `messages`, `friends`, `users/block`
- `notifications`, `push`
- `agent`, `admin`, `ops`, `cron`

Principes a conserver :

- Toujours verifier la session cote serveur.
- Utiliser `activeRole` pour les decisions d'autorisation metier.
- Valider les entrees avec les schemas/helpers existants dans `lib/shared` ou services locaux.
- Garder les objets sensibles et documents prives derriere des signatures ou routes autorisees.
- Eviter de dupliquer la logique entre UI et API ; l'API doit etre la source de verite.

## 7. Donnees et modeles

Les modeles sont dans `lib/models`. Les familles importantes :

- Utilisateurs et roles : `User`, `OrganizerProfile`, `ProviderProfile`, `OrganizerMember`.
- Evenements et billets : `Event`, `Ticket`, `Order`, `EventOrder`, `SeatHold`, `SeatInvitation`, `EventStaff`, `PromoCode`.
- Paiement/remboursement : `RefundCase`, `RefundProof`, `RefundPoint`, `PayoutRequest`, `SellerBalance`, `EventPayout`, `CashSaleSettlement`, `PaymentAlert`.
- Messagerie/social : `Conversation`, `Message`, `MessageDigest`, `Friendship`, `FriendRequest`, `Report`, `Review`, `ReviewReport`.
- Contenu/ops : `BlogPost`, `HomepageConfig`, `Boost`, `BoostSlot`, `Vercel*`.

Avant de modifier un modele, verifier :

- Les index et unicites existants.
- Les scripts `db:ensure-indexes`, seeds et tests associes.
- Les effets sur l'application mobile qui consomme la meme API.
- Les migrations eventuelles si le champ est deja en production.

## 8. Integrations externes

| Integration | Usage | Emplacements typiques |
|---|---|---|
| Auth.js | Session, login, JWT, credentials | `auth.ts`, `app/api/auth`, `types/next-auth.d.ts` |
| MongoDB/Mongoose | Persistance metier | `lib/db`, `lib/models` |
| FedaPay | Paiements XOF/Mobile Money, subscriptions | `lib/server/payments`, routes checkout/subscriptions |
| Stripe | Paiements/webhook existants | `app/api/stripe-webhook`, services paiement |
| Resend | Emails transactionnels | `lib/server/emails` |
| Cloudinary | Upload medias/documents | routes `uploads`, `applications/documents`, helpers client |
| Web Push | Notifications navigateur | `lib/client/push`, routes `push`, templates notifications |
| Vercel | Hosting, crons, analytics, ops | `vercel.json`, `scripts/audit-vercel-*`, `config/` |

Les secrets ne doivent pas etre commites. Les scripts sensibles lisent generalement `.env.local` ou les variables Vercel.

## 9. Commandes utiles

Installation :

```bash
pnpm install
```

Developpement :

```bash
pnpm dev
```

Build :

```bash
pnpm build
```

Qualite :

```bash
pnpm lint
pnpm lint:core
pnpm test
pnpm test:unit
pnpm test:integration:optional
pnpm test:e2e
```

Seeds et donnees :

```bash
pnpm seed
pnpm seed:e2e
pnpm seed:bulk
pnpm db:ensure-indexes
```

Checks mobile/API :

```bash
pnpm check:mobile-api
pnpm check:mobile-config
pnpm check:mobile-readiness
pnpm check:mobile-web-smoke
```

Ops :

```bash
pnpm ops:readiness
pnpm ops:smoke
pnpm audit:vercel-pro-suite
pnpm audit:growth
```

## 10. Strategie de test

Le depot combine trois niveaux :

- Unitaires Vitest : logique serveur, helpers, composants critiques.
- Integration optionnelle : dependances necessitant une URI MongoDB ou services configures.
- E2E Playwright : parcours publics, auth, routes protegees, messagerie, tickets, paiements/webhooks, scanner, notifications.

Avant de livrer une evolution, viser au minimum :

1. `pnpm lint:core`
2. `pnpm test:unit`
3. Le test e2e cible du domaine modifie si disponible.
4. `pnpm build` pour les changements de routes, modeles ou Next.js.

Si un test ne peut pas tourner faute de secret/service, documenter explicitement la commande et la raison.

## 11. Documentation existante a connaitre

- `docs/architecture/ARCHITECTURE_COMPLETE.md` : vision architecture/fonctionnelle globale.
- `docs/architecture/COMPONENT_ARCHITECTURE.md` : conventions de composants.
- `docs/architecture/modals.md` : modales et slide-overs.
- `docs/qa/QA_TEST_PLAN.md` : plan de recette.
- `docs/features-par-role-web-mobile*.md` : couverture fonctionnelle par role.
- `docs/ops/*.md` : readiness production, SEO/growth, Vercel Pro.
- `docs/IMPLEMENTATION_LIB_V1_SUIVI.md` : suivi d'implementation.
- `docs/JOURNAL_HEBDOMADAIRE_REPRISE_TOUTPUISSANTGED.md` : journal de reprise ajoute avec ce document.

## 12. Flux de contribution recommande

1. Lire la documentation du domaine concerne.
2. Verifier l'etat Git et identifier les modifications deja presentes.
3. Localiser la route API, le service serveur et les modeles impliques.
4. Ajouter/modifier les tests au plus pres du domaine.
5. Lancer les commandes ciblees.
6. Mettre a jour la documentation si le comportement ou la surface API change.
7. Eviter les refontes opportunistes hors scope.

## 13. Points de vigilance pour la suite

- Le depot contient beaucoup de modifications recentes non commitees ; ne pas les ecraser.
- Les duplications admin/agent doivent etre modifiees prudemment pour garder les deux espaces coherents.
- Les changements de roles doivent utiliser `activeRole`, pas seulement `roles`.
- Les remboursements, reversements et paiements touchent plusieurs modeles et emails ; verifier les effets de bord.
- Les routes cron doivent rester idempotentes.
- Les changements d'UI doivent respecter le systeme de theme clair/sombre et les tokens globaux.
- L'application mobile depend de l'API Web ; tout changement de contrat doit etre verifie avec les scripts `check:mobile-*`.
- Les documents prives et medias doivent conserver les controles d'acces et signatures.

## 14. Prochaines actions conseillees

- Stabiliser un backlog technique par domaine : paiements/remboursements, staff/scanner, messagerie, mobile API, ops.
- Produire une matrice de responsabilite API -> service -> modele pour les endpoints critiques.
- Verifier l'alignement entre `admin` et `agent` pour reduire la duplication.
- Maintenir le journal hebdomadaire apres chaque sprint.
- Completer la documentation environnement/secrets si l'equipe reprend aussi l'exploitation.
