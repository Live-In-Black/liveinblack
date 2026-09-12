# DOSSIER DE CADRAGE EXHAUSTIF DU PROJET LIVE IN BLACK
**Document de transmission pour modélisation complète des User Flows, Wireframes et Spécifications UX/UI**  
*Date de consolidation : 12 septembre 2026*

---

## 1. VISION, PÉRIMÈTRE & RÈGLES MÉTIER FONDAMENTALES (V1)

### 1.1 Nature et marché cible
* **Nature :** Marketplace événementielle tout-en-un réunissant le grand public (festivaliers/sorteurs), les organisateurs d'événements et les prestataires de l'événementiel (DJ, traiteurs, lieux, sécurité, etc.).
* **Périmètre géographique V1 :** **Bénin uniquement** (villes principales : Cotonou, Calavi, Ouidah, Porto-Novo, etc.). Aucune ouverture internationale simultanée pour le lancement initial.
* **Devise monétaire :** **Franc CFA (FCFA / code ISO : XOF)** exclusif sur l'ensemble de la plateforme (aucune mention d'EUR / €).
* **Écosystème technique :**
  * **Web :** Next.js (SSR, React, TypeScript), CSS Vanilla moderne, déployé sur Vercel.
  * **Mobile :** React Native avec Expo Router (iOS & Android).
  * **Base de données & Auth :** PostgreSQL / Supabase, API routes sécurisées.
  * **Paiement :** Passerelle **FedaPay** Marketplace (Mobile Money MTN / Moov Bénin + Cartes bancaires).

---

### 1.2 Règle d'or : Étanchéité absolue des types de comptes (V1-09)
* **Pas de multi-rôles sur un même compte :** Une même personne ne peut pas basculer entre Client, Organisateur et Prestataire avec une seule connexion.
* **1 Adresse E-mail = 1 Type de Compte unique.**
* Pour exercer plusieurs activités, l'utilisateur doit créer des comptes séparés avec des adresses e-mails distinctes.
* **Permissions contextuelles d'agents :** Les membres du staff événementiel (ex: contrôle d'accès / scan, vente guichet) sont des comptes Clients standards auxquels un organisateur a délégué une mission temporaire sur un événement précis.

---

### 1.3 Règles financières & Billetterie (V1)
* **Paiement direct FedaPay Marketplace :** Répartition des fonds au moment du paiement entre la plateforme et l'organisateur.
* **Exclusions V1 :**
  * Pas de système de revente de billets entre particuliers en V1.
  * Pas de portefeuille d'argent virtuel (wallet cash) ni de points de fidélité.
  * Pas de versement différé à J+5 ni d'avance automatique de 50 %.
* **Modèle économique Prestataires :** Abonnement forfaitaire de **9 000 FCFA / mois** pour être référencé dans l'annuaire et recevoir des demandes de devis. Les paiements de prestations de services s'effectuent directement entre l'organisateur et le prestataire.

---

## 2. INVENTAIRE EXHAUSTIF DES RÔLES & PERMISSIONS

### Rôle 1 : Visiteur Anonyme (Non connecté)
* Découvre la page d'accueil avec les rails d'événements : *Top 3, Ce soir, Pour toi, À la une*.
* Recherche globale textuelle : par nom d'événement, organisateur, prestataire, ville ou style musical.
* Consulte les fiches détaillées :
  * Fiche Événement : Titre, date, lieu, coordonnées GPS / plan d'accès, line-up, dress-code, âge minimum, tarifs en FCFA, quotas restants, menus/précommandes.
  * Fiche Organisateur : Bio, événements à venir, réseaux sociaux, événements passés.
  * Fiche Prestataire : Description des services, galerie photos, zone géographique d'intervention.
* Accède au Blog éditorial (articles culturels et vie nocturne au Bénin).
* Consulte les pages légales : CGU, Confidentialité, Cookies, Mentions légales.
* **Interdiction :** Ne peut ni acheter, ni réserver, ni envoyer de message sans créer un compte / se connecter.

---

### Rôle 2 : Client / Festivalier (Connecté)
* **Achat & Réservations :**
  * Achat de billets simples (gratuit ou payant via FedaPay en FCFA).
  * Achat de billets groupés ou formules Tables / Carrés VIP.
  * Réservation temporaire avec acompte (**Seat Hold 24h ou 72h**) pour bloquer une table, puis paiement du solde avant expiration.
* **Portefeuille de Billets (My Tickets) :**
  * Consultation des billets actifs, passés et annulés.
  * Affichage du **QR Code dynamique sécurisé anti-fraude** pour l'entrée.
  * Accès à une page publique sécurisée par token (`/ticket/[token]`) pour afficher son billet sur navigateur mobile en cas de panne d'application.
  * Demande d'annulation / remboursement soumise à la politique de l'organisateur.
* **Social & Communauté :**
  * Suivi d'organisateurs favoris (avec réception d'alertes notifications lors d'un nouvel événement).
  * Liste d'événements intéressants / favoris.
  * Messagerie instantanée : discussions 1-to-1, groupes de discussion, messages importants favoris.
* **Gestion du Profil :**
  * Photo de profil, nom, prénom, téléphone (+229).
  * Préférences de sorties (styles musicaux, ambiances, artistes préférés, budget moyen).
  * Paramètres de confidentialité (visibilité du statut en ligne, de la photo, confirmations de lecture).
  * Export des données personnelles et demande de suppression de compte.

---

### Rôle 3 : Organisateur d'Événements (Espace Pro / Studio)
* **Création & Gestion d'Événements :**
  * Formulaire de création complet : Titre, date et plage horaire, localisation précise (Bénin), visuel/flyer, consignes (âge min, dress-code).
  * Paramétrage de la billetterie : Création des catégories (Pass Standard, VIP, Table VIP, etc.), fixation des prix en FCFA, quotas de places, dates d'ouverture/fermeture des ventes.
  * Options additionnelles : Menus boissons/bouteilles, précommandes.
* **Tableau de Bord & Métriques de Vente :**
  * Statistiques en direct : Billets vendus, chiffre d'affaires généré, taux de remplissage de la salle.
  * Liste détaillée des participants (nom, type de billet acheté, statut de présence).
* **Gestion du Staff Événement :**
  * Attribution des rôles opérationnels pour le jour J à des utilisateurs :
    * Mission **Scanner Entrée** (droits de contrôle d'accès).
    * Mission **Vendeur Guichet** (droits d'encaissement sur place).
* **Gestion Financière & SAV :**
  * Traitement des demandes de remboursement des clients (validation ou refus motivé).
  * Historique des transactions et coordonnées bancaires / FedaPay.

---

### Rôle 4 : Staff Terrain / Agents Événementiels (Jour J)
* **Contrôle d'accès (Scanner QR Code) :**
  * Accès caméra mobile native pour scanner les billets des festivaliers.
  * Affichage immédiat du verdict :
    * 🟢 **Billet Valide** $\rightarrow$ Entrée autorisée (le billet passe automatiquement en statut `Scanné`).
    * 🔴 **Billet Déjà Scanné** $\rightarrow$ Alerte rouge anti-fraude immédiate avec horodatage du premier scan.
    * 🔴 **Billet Invalide / Inconnu / Annulé** $\rightarrow$ Refus d'accès.
  * Clavier de saisie manuelle de secours si l'appareil photo est endommagé ou en cas de faible luminosité.
* **Vente Guichet (Agent Sales) :**
  * Interface simplifiée pour vendre des billets directement à la porte de l'événement.
  * Encaissement en espèces ou via Mobile Money.
  * Génération immédiate du billet numérique ou remise du reçu avec QR Code.

---

### Rôle 5 : Prestataire de Services (Espace Pro)
* **Vitrine Professionnelle :**
  * Fiche publique présentant les compétences : DJ, sonorisation, éclairage, traiteur, sécurité, photographie, lieu/salle, etc.
  * Galerie de réalisations, zone géographique d'activité (Bénin).
* **Abonnement & Monétisation :**
  * Gestion de l'abonnement mensuel (9 000 FCFA/mois).
* **Demandes de Contact & Devis :**
  * Réception des demandes de contact et devis des organisateurs via la messagerie interne.
  * Échange direct et contractualisation hors commission sur la prestation.

---

### Rôle 6 : Agent / Administrateur LIVE IN BLACK (Back-Office)
* **Validation & Conformité (KYC) :**
  * Validation des dossiers d'inscription des Organisateurs (vérification de la pièce d'identité).
  * Validation des profils Prestataires.
* **Modération & Sécurité :**
  * Modération des événements publiés (suspension si non-respect des règles ou fraude avérée).
  * Traitement des signalements utilisateurs et blocage de comptes malveillants.
* **Gestion Financière & Litiges :**
  * Surveillance globale des transactions FedaPay.
  * Arbitrage des dossiers de litiges / contestations de remboursements.
* **Gestion Éditoriale :**
  * Publication et modération des articles du Blog Bénin.

---

## 3. CARTOGRAPHIE DES ROUTES (ÉCRANS WEB & MOBILE)

### Routes Publiques (Web & Mobile)
| Route Web | Écran Mobile équivalent | Description |
| :--- | :--- | :--- |
| `/home` | `app/(tabs)/index.tsx` | Accueil, rails d'événements, sélecteur rapide |
| `/search` | `app/(tabs)/search.tsx` | Moteur de recherche unifié (Events, Orgas, Prestataires) |
| `/events` | Liste intégrée à search | Catalogue complet des événements avec filtres |
| `/events/[id]` | `app/event/[id].tsx` | Fiche détaillée d'un événement |
| `/organizers` | `app/organizers.tsx` | Annuaire public des organisateurs |
| `/organizers/[slug]`| `app/organizer/[slug].tsx`| Profil public d'un organisateur |
| `/providers` | `app/providers.tsx` | Annuaire public des prestataires |
| `/providers/[id]` | `app/provider/[id].tsx` | Profil public d'un prestataire |
| `/blog`, `/blog/[slug]`| Web uniquement / webview | Articles éditoriaux & vie nocturne Bénin |
| `/legal-notice`, `/terms`, `/privacy`| `app/legal/[page].tsx`| Pages juridiques et politiques |

### Routes d'Authentification & Comptes
| Route Web | Écran Mobile équivalent | Description |
| :--- | :--- | :--- |
| `/login` | `app/login.tsx` | Connexion unifiée |
| `/confirmer-email` | `app/verify-email.tsx` | Confirmation de l'adresse email |
| `/reset-password` | `app/reset-password.tsx` | Réinitialisation mot de passe oublié |
| `/organizer-signup`| `app/apply/organizer.tsx`| Inscription dédiée Organisateur |
| `/provider-signup` | `app/apply/provider.tsx` | Inscription dédiée Prestataire |

### Routes Espace Connecté (Client & Social)
| Route Web | Écran Mobile équivalent | Description |
| :--- | :--- | :--- |
| `/profile` | `app/(tabs)/profile.tsx` | Profil utilisateur, paramètres et raccourcis |
| `/profile/billets` | `app/(tabs)/tickets.tsx` | Portefeuille de billets (Wallet numérique) |
| `/order/[eventId]/[ticketCode]`| `app/order/[eventId]/[ticketCode].tsx`| Billet individuel plein écran avec QR Code |
| `/ticket/[token]` | Page de secours web | Vue sécurisée du billet via lien direct |
| `/checkout/[eventId]`| `app/checkout/[eventId].tsx`| Tunnel de paiement et commande de billets |
| `/messages` | `app/(tabs)/messages.tsx` | Liste des conversations de messagerie |
| `/messages/[id]` | `app/conversation/[id].tsx` | Chat 1-to-1 ou groupe avec pièces jointes |
| `/notifications` | Panneau notifications | Centre de notifications in-app |
| `/profile/followed-organizers`| `app/followed-organizers.tsx`| Liste des organisateurs suivis |
| `/profile/interested-events`| `app/interested-events.tsx`| Liste des événements enregistrés |

### Routes Professionnelles & Outils Terrain (Staff / Orga / Prestataire)
| Route Web | Écran Mobile équivalent | Description |
| :--- | :--- | :--- |
| `/organizer-studio`| `app/spaces/organizer.tsx`| Dashboard organisateur (ventes, stats, gestion) |
| `/my-events` | `app/spaces/organizer.tsx`| Liste des événements créés |
| `/scanner/[eventId]`| `app/scanner.tsx` | Scanner caméra pour contrôle d'accès |
| `/on-site-sales/[eventId]`| `app/agent-sales/[eventId].tsx`| Guichet de vente de billets sur place |
| `/offer-services` | `app/spaces/provider.tsx` | Espace de gestion du prestataire |
| `/my-shifts` | `app/my-shifts.tsx` | Planning des missions assignées au staff |

### Routes Back-Office (Administration LIB - Web uniquement)
* `/agent` : Dashboard général de supervision
* `/agent/comptes` : Gestion des utilisateurs et modération
* `/agent/dossiers` : Validation des dossiers organisateurs et prestataires
* `/agent/evenements` : Contrôle et modération des événements publiés
* `/agent/paiements` : Suivi des transactions et webhooks FedaPay
* `/agent/signalements` : Traitement des signalements d'abus ou litiges
* `/agent/blog` : Rédaction et publication des articles

---

## 4. MATRICE COMPLÈTE DES INTERACTIONS & NOTIFICATIONS

Le système envoie des notifications automatiques sur 3 canaux (**In-App, Email, Push mobile**) pour chaque étape critique :

1. **Création de compte :** Email de bienvenue + vérification de l'adresse.
2. **Achat de billet réussi :** Notification In-App + Email avec récapitulatif de commande et QR Code en pièce jointe.
3. **Paiement échoué / interrompu :** Alerte visuelle immédiate + possibilité de réessayer sans recréer le panier.
4. **Attribution de mission Staff :** Le festivalier reçoit une notification l'informant qu'il a été désigné comme *Agent Scanner* ou *Vendeur Guichet* pour un événement spécifique.
5. **Validation de dossier Organisateur :** Notification et email informant de l'approbation du profil professionnel.
6. **Demande de remboursement :** 
   * Au client : Confirmation de prise en compte.
   * À l'organisateur : Alerte l'invitant à traiter la demande dans son dashboard.
   * Au client : Décision finale (remboursement validé ou refus motivé).
7. **Messagerie :** Notification push et in-app à la réception d'un nouveau message ou invitation de groupe.
