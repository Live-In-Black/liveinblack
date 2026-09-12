# 🗺️ CARTE COMPLÈTE DES USER FLOWS — LIVE IN BLACK
**Marché : Bénin 🇧🇯 | Devise : FCFA | Paiement : FedaPay**
*Version 1.0 — 12 Septembre 2026*

---

## 🧭 CARTE MACRO : Vue Globale du Système

```mermaid
graph TD
    V([🧑 Visiteur Anonyme]) --> DECOUV[Découverte & Navigation Publique]
    DECOUV --> AUTH{Connexion / Inscription}

    AUTH -->|Email Compte Client| CL((👤 CLIENT))
    AUTH -->|Email Dédié Pro| OR((🎪 ORGANISATEUR))
    AUTH -->|Email Dédié Pro| PR((🎵 PRESTATAIRE))

    CL --> F_CL[Achat Billets\nWallet QR Code\nSocial & Messages]
    OR --> F_OR[Studio Événements\nStatistiques\nGestion Staff]
    PR --> F_PR[Vitrine Pro\nAbonnement\nDevis & Messages]

    F_CL -->|Mission attribuée| ST((🔦 STAFF TERRAIN))
    ST --> SC[Scan Scanner Entrée]
    ST --> VS[Vente Guichet]

    OR --> AG_APP[Candidature Admin LIB]
    PR --> AG_APP
    AG_APP --> AGENT((🛡️ AGENT / ADMIN LIB))
    AGENT --> BACKOFFICE[Back-Office\nValidation · Modération · Finance]
```

---

## 🔐 FLOW 1 — Authentification & Séparation des Comptes

```mermaid
flowchart TD
    START([🧑 Arrivée sur la Plateforme]) --> LANDING[Page d'Accueil / Accueil Mobile]
    LANDING --> ACTION{L'utilisateur veut agir}

    ACTION -->|Navigation publique| PUBLIC[Parcours Visiteur]
    ACTION -->|Action protégée| AUTH_GATE[Mur d'Authentification]

    AUTH_GATE --> LOGIN[Page Connexion]
    AUTH_GATE --> REGISTER{Créer un Compte}

    REGISTER --> REG_CLIENT[Inscription Client\nNom · Prénom · Email · MDP]
    REGISTER --> REG_ORGA[Inscription Organisateur\nEmail dédié · Pièce d'identité\n⟶ Validation Agent]
    REGISTER --> REG_PREST[Inscription Prestataire\nEmail dédié · Métier · Zone\n⟶ Abonnement 9 000 FCFA/mois]

    REG_CLIENT --> VERIF[Email de Vérification]
    REG_ORGA --> VERIF
    REG_PREST --> VERIF

    VERIF --> CONFIRM[Clic sur le lien de confirmation]
    CONFIRM --> LOGGED[✅ Compte Activé]

    LOGIN --> FORGOT{Mot de passe oublié ?}
    FORGOT -->|Oui| RESET[Lien de Réinitialisation par Email]
    RESET --> NEW_PASS[Nouveau Mot de Passe]
    NEW_PASS --> LOGGED
    FORGOT -->|Non| MDP[Saisie Email + Mot de Passe]
    MDP --> LOGGED

    LOGGED -->|Client| DASH_CL[Dashboard Client]
    LOGGED -->|Organisateur approuvé| DASH_OR[Studio Organisateur]
    LOGGED -->|Prestataire actif| DASH_PR[Espace Prestataire]
    LOGGED -->|Admin LIB| DASH_AG[Back-Office Agent]

    subgraph "⚠️ Règle Étanchéité Stricte"
        NOTE1[Un email = Un seul type de compte]
        NOTE2[Pas de basculement entre rôles]
        NOTE3[Besoin de 2 activités = 2 emails distincts]
    end
```

---

## 🧑 FLOW 2 — Visiteur Anonyme (Découverte)

```mermaid
flowchart TD
    V([Visiteur Non Connecté]) --> HOME[🏠 Accueil\nRails : Top 3 · Ce soir · Pour toi · À la une]
    HOME --> BROWSE{Que faire ?}

    BROWSE --> SEARCH[🔍 Recherche Globale\nÉvénements · Organisateurs · Prestataires · Villes]
    BROWSE --> EVENTS_LIST[📅 Catalogue Événements\nFiltres : Date · Catégorie · Ville · Style]
    BROWSE --> ORGANIZERS[🎪 Annuaire Organisateurs]
    BROWSE --> PROVIDERS[🎵 Annuaire Prestataires]
    BROWSE --> BLOG[📰 Blog Bénin\nVie nocturne · Culture · Lifestyle]

    SEARCH --> EVT_DETAIL
    EVENTS_LIST --> EVT_DETAIL[📋 Fiche Événement\nTitre · Date · Lieu · Prix FCFA · Line-up\nDress-code · Âge minimum · Plan d'accès · Photos]
    ORGANIZERS --> ORG_DETAIL[🎪 Profil Organisateur\nBio · Événements à venir · Réseaux sociaux]
    PROVIDERS --> PRV_DETAIL[🎵 Profil Prestataire\nServices · Galerie · Zone intervention]

    EVT_DETAIL --> WANT_BUY{Acheter un billet ?}
    WANT_BUY -->|Oui| AUTH_GATE[🔒 Connexion / Inscription requise]
    WANT_BUY -->|Non| CONTINUE[Continuer la navigation]

    EVT_DETAIL --> SHARE[📲 Partage enrichi\nOpen Graph · Lien direct]
    ORG_DETAIL --> WANT_FOLLOW{Suivre l'orga ?}
    WANT_FOLLOW -->|Oui| AUTH_GATE
```

---

## 🎟️ FLOW 3 — Client : Achat de Billet (Tunnel Complet)

```mermaid
flowchart TD
    CL([👤 Client Connecté]) --> EVT_DETAIL[📋 Fiche Événement]
    EVT_DETAIL --> CHOOSE_TKT[🎫 Choisir Catégorie de Billet\nStandard · VIP · Table/Carré · Gratuit]
    CHOOSE_TKT --> PROMO{Code Promo ?}
    PROMO -->|Oui| APPLY_PROMO[Appliquer le code\nRéduction calculée]
    PROMO -->|Non| CART[🛒 Récapitulatif Panier\nTotal en FCFA]
    APPLY_PROMO --> CART

    CART --> CHECKOUT[💳 Tunnel de Paiement]
    CHECKOUT --> FEDAPAY{FedaPay}
    FEDAPAY --> MOB_MONEY[📱 Mobile Money\nMTN ou Moov Bénin]
    FEDAPAY --> CARD[💳 Carte Bancaire]

    MOB_MONEY --> CONFIRM_PAY{Paiement confirmé ?}
    CARD --> CONFIRM_PAY

    CONFIRM_PAY -->|✅ Succès| WEBHOOK[Webhook FedaPay → Serveur LIB]
    CONFIRM_PAY -->|❌ Échec / Timeout| RETRY[⚠️ Erreur — Réessayer\nsans perdre le panier]

    WEBHOOK --> GEN_TICKET[🎫 Génération du Billet + QR Code Dynamique]
    GEN_TICKET --> NOTIF[📨 Notifications\nIn-App + Email avec QR Code]
    GEN_TICKET --> WALLET[👛 Billet visible dans\nMes Billets / Wallet]

    subgraph "Cas Spéciaux"
        SEAT_HOLD[🪑 Seat Hold — Réservation Table\nAcompte → Solde à payer avant expiration\n24h ou 72h selon config organisateur]
    end
```

---

## 👛 FLOW 4 — Client : Gestion du Portefeuille de Billets (Wallet)

```mermaid
flowchart TD
    CL([👤 Client Connecté]) --> WALLET[Onglet Mes Billets / Wallet]
    WALLET --> TABS{Filtrer par statut}
    TABS --> ACTIF[✅ Billets Actifs]
    TABS --> PASSE[🕐 Billets Passés]
    TABS --> ANNULE[❌ Billets Annulés]

    ACTIF --> TKT_DETAIL[📱 Billet Plein Écran\nNom Événement · Date · Lieu · Type]
    TKT_DETAIL --> QR[🔲 QR Code Dynamique Anti-Fraude]
    TKT_DETAIL --> SHARE_TKT[📲 Partager / Exporter le billet]
    TKT_DETAIL --> PLAYLIST[🎵 Accéder à la Playlist de l'événement]
    TKT_DETAIL --> ONSITE[🍾 Commander sur place depuis le billet]

    QR --> FALLBACK[🌐 Lien de secours /ticket/token\nAccessible sans appli]

    ACTIF --> REFUND_REQUEST{Demande d'annulation / remboursement ?}
    REFUND_REQUEST -->|Oui, conditions remplies| SUBMIT_REFUND[📝 Formulaire de demande\nMotif + Confirmation]
    SUBMIT_REFUND --> NOTIF_ORGA[📨 Alerte à l'Organisateur]
    NOTIF_ORGA --> ORGA_DECISION{Décision Organisateur}
    ORGA_DECISION -->|Approuvé| REFUNDED[💸 Remboursement validé\nNotification Client]
    ORGA_DECISION -->|Refusé| REFUSED[⛔ Refus motivé\nNotification Client]
```

---

## 🎪 FLOW 5 — Organisateur : Création & Gestion d'Événement

```mermaid
flowchart TD
    OR([🎪 Organisateur Connecté]) --> STUDIO[🎛️ Studio Organisateur\nDashboard Principal]
    STUDIO --> ACTIONS{Action}

    ACTIONS --> NEW_EVT[➕ Créer un Événement]
    ACTIONS --> MANAGE[📋 Gérer Événements Existants]
    ACTIONS --> STATS_GLOBAL[📊 Statistiques Globales]
    ACTIONS --> PAYOUTS[💰 Reversements FedaPay]

    NEW_EVT --> FORM_INFO[📝 Infos Générales\nTitre · Description · Date/Heure · Lieu Bénin]
    FORM_INFO --> FORM_MEDIA[🖼️ Médias\nFlyer · Photos · Vidéo]
    FORM_MEDIA --> FORM_RULES[⚙️ Conditions\nÂge Minimum · Dress-Code · Consignes]
    FORM_RULES --> FORM_TICKETS[🎫 Configuration Billetterie\nCatégories · Prix FCFA · Quotas · Dates de vente]
    FORM_TICKETS --> FORM_OPTIONS[🍾 Options Additionnelles\nMenus · Précommandes · Codes Promo]
    FORM_OPTIONS --> PUBLISH{Publier ?}
    PUBLISH -->|✅ Publier maintenant| LIVE[🌐 Événement en Ligne]
    PUBLISH -->|🕐 Programmer| SCHEDULED[Planification de publication]

    MANAGE --> EVT_DASH[📊 Dashboard Événement]
    EVT_DASH --> VENTES[📈 Ventes en Direct\nBillets vendus · CA · Taux remplissage]
    EVT_DASH --> GUESTLIST[👥 Guestlist Participants]
    EVT_DASH --> BOOKINGS[🪑 Réservations Tables]
    EVT_DASH --> STAFF_MGMT[👷 Gestion Staff]
    EVT_DASH --> PROMO_CODES[🏷️ Codes Promo]
    EVT_DASH --> EDIT_EVT[✏️ Modifier l'Événement]
    EVT_DASH --> BOOST[🚀 Boost / Mise en Avant]

    STAFF_MGMT --> ASSIGN_SCAN[🔦 Assigner Scanner d'Entrée]
    STAFF_MGMT --> ASSIGN_SELL[🏷️ Assigner Vendeur Guichet]
    ASSIGN_SCAN --> NOTIF_STAFF[📨 Notification à l'agent désigné]
    ASSIGN_SELL --> NOTIF_STAFF

    GUESTLIST --> REFUND_INBOX[📩 Demandes de Remboursement]
    REFUND_INBOX --> REFUND_DECIDE{Décision}
    REFUND_DECIDE -->|Approuver| OK_REFUND[✅ Confirmer le remboursement]
    REFUND_DECIDE -->|Refuser| NOK_REFUND[❌ Refus motivé]
```

---

## 🔦 FLOW 6 — Staff Terrain : Contrôle d'Accès & Vente Guichet (Jour J)

```mermaid
flowchart TD
    STAFF([🔦 Staff Terrain Connecté]) --> MISSION{Mission attribuée}

    MISSION -->|Scanner Entrée| SCANNER[📷 Ouvrir Scanner Caméra\nPermission caméra native]
    MISSION -->|Vendeur Guichet| SALES[🏷️ Écran Vente Agent]

    SCANNER --> CAM{Caméra OK ?}
    CAM -->|Oui| SCAN_QR[🔲 Scanner le QR Code du billet]
    CAM -->|Non / Faible lumière| MANUAL[⌨️ Saisie Manuelle du Code]

    SCAN_QR --> API{Vérification API en temps réel}
    MANUAL --> API

    API -->|✅ Valide + Premier scan| GREEN[🟢 Entrée Autorisée\nNom · Type de billet · Numéro]
    API -->|🔴 Déjà scanné| FRAUD[🔴 ALERTE FRAUDE\nHorodatage du premier passage]
    API -->|🔴 Invalide / Annulé / Inconnu| INVALID[🔴 Billet Refusé\nMotif affiché]

    GREEN --> NEXT_SCAN[Scanner le prochain billet]
    FRAUD --> NEXT_SCAN
    INVALID --> NEXT_SCAN

    SALES --> SELECT_TKT[Sélectionner Catégorie\nStandard · VIP · Table]
    SELECT_TKT --> PAYMENT_MODE{Mode de Paiement}
    PAYMENT_MODE --> CASH[💵 Espèces]
    PAYMENT_MODE --> MOMO[📱 Mobile Money\nMTN / Moov]
    CASH --> GEN_TKT[🎫 Génération Immédiate du Billet]
    MOMO --> GEN_TKT
    GEN_TKT --> PRINT_OR_SEND[Afficher QR Code\nou Envoyer par SMS / Email]
```

---

## 🎵 FLOW 7 — Prestataire de Services

```mermaid
flowchart TD
    PR([🎵 Prestataire Connecté]) --> DASH_PR[🏢 Espace Prestataire]
    DASH_PR --> ACTIONS_PR{Action}

    ACTIONS_PR --> PROFILE[✏️ Compléter / Modifier le Profil\nMétier · Bio · Galerie · Zone Bénin]
    ACTIONS_PR --> SUB[💳 Gérer l'Abonnement\n9 000 FCFA / mois via FedaPay]
    ACTIONS_PR --> INBOX[📩 Demandes de Devis reçues]
    ACTIONS_PR --> REVIEWS[⭐ Avis & Réputation]

    PROFILE --> VISIBLE[🌐 Profil Visible dans\nl'Annuaire Public /providers]
    VISIBLE --> ORGANIZER_CONTACT[Organisateur consulte la fiche\net envoie une demande]
    ORGANIZER_CONTACT --> MSG_PR[💬 Messagerie\nÉchange et négociation directe]
    MSG_PR --> DEAL[🤝 Prestation contractualisée\nPaiement direct hors commission LIB]

    INBOX --> MSG_PR
```

---

## 🛡️ FLOW 8 — Agent / Administrateur LIB (Back-Office)

```mermaid
flowchart TD
    AG([🛡️ Agent LIB Connecté]) --> BACKOFFICE[🖥️ Portail Back-Office /agent]
    BACKOFFICE --> SECTIONS{Section}

    SECTIONS --> DOSSIERS[📁 Validation Dossiers]
    SECTIONS --> USERS[👥 Gestion Utilisateurs]
    SECTIONS --> EVENTS_MOD[📅 Modération Événements]
    SECTIONS --> FINANCE[💰 Surveillance Financière]
    SECTIONS --> SIGNALS[🚩 Signalements & Litiges]
    SECTIONS --> BLOG_ADMIN[📰 Gestion Blog Bénin]
    SECTIONS --> HOMEPAGE[🏠 Pilotage Page d'Accueil]
    SECTIONS --> BOOSTS[🚀 Gestion Boosts]
    SECTIONS --> DELETIONS[🗑️ Demandes de Suppression]

    DOSSIERS --> ORGA_DOSSIER[Vérification Dossier Organisateur\nPièce d'identité · Légitimité]
    DOSSIERS --> PREST_DOSSIER[Vérification Dossier Prestataire\nMétier · Identité]
    ORGA_DOSSIER --> VALIDATE{Décision}
    PREST_DOSSIER --> VALIDATE
    VALIDATE -->|✅ Valider| NOTIF_VALID[📨 Email + Notification d'Approbation]
    VALIDATE -->|❌ Rejeter| NOTIF_REJECT[📨 Email de Refus motivé]

    USERS --> BLOCK_USER[🚫 Blocage Compte Malveillant]
    USERS --> USER_DETAIL[Fiche Utilisateur Détaillée]

    EVENTS_MOD --> SUSPEND_EVT[⏸️ Suspendre un Événement]
    EVENTS_MOD --> APPROVE_EVT[✅ Valider un Événement signalé]

    SIGNALS --> SIGNAL_DETAIL[Détail du Signalement]
    SIGNAL_DETAIL --> ARBITRATE[⚖️ Arbitrage du Litige]

    FINANCE --> TRANSACTIONS[📊 Tableau des Transactions FedaPay]
    FINANCE --> PAYOUTS[💸 Suivi des Reversements Organisateurs]
```

---

## 💬 FLOW 9 — Messagerie & Notifications (Transversal à tous les rôles)

```mermaid
flowchart TD
    ANY([Tout Utilisateur Connecté]) --> MSG_HUB[Onglet Messages / Conversations]

    MSG_HUB --> CONV_TYPES{Type de Conversation}
    CONV_TYPES --> DIRECT[💬 Conversation Privée 1-to-1]
    CONV_TYPES --> GROUP[👥 Groupe de Discussion]

    DIRECT --> SEND_MSG[✍️ Rédiger et envoyer un message]
    GROUP --> SEND_MSG
    SEND_MSG --> DELIVER[📨 Livraison Instantanée]
    DELIVER --> NOTIF_PUSH[🔔 Notification Push\n+ Badge compteur In-App]

    GROUP --> GROUP_ACTIONS{Actions Groupe}
    GROUP_ACTIONS --> ADD_MEMBER[➕ Ajouter un membre]
    GROUP_ACTIONS --> REMOVE_MEMBER[➖ Retirer un membre]
    GROUP_ACTIONS --> LEAVE_GROUP[🚪 Quitter le groupe]

    MSG_HUB --> STARRED[⭐ Messages Importants\nÉpinglés & favoris]
    MSG_HUB --> NEW_GROUP[➕ Créer un Nouveau Groupe]

    ANY --> FRIENDS_FLOW{Social}
    FRIENDS_FLOW --> SEND_FR[➕ Demande d'Ami]
    SEND_FR --> ACCEPT_REJECT{Réponse}
    ACCEPT_REJECT -->|Accepter| FRIENDS[✅ Amis Connectés]
    ACCEPT_REJECT -->|Refuser| DECLINED[❌ Refusée]
    FRIENDS_FLOW --> BLOCK[🚫 Bloquer / Débloquer]

    subgraph "🔔 Canaux de Notification (3 simultanés)"
        INAPP[In-App : Centre de notifications]
        EMAIL[Email : 58 templates préparés]
        PUSH[Push Mobile : iOS & Android]
    end
```

---

## 📊 FLOW 10 — Synthèse des Correspondances Écrans Web ↔ Mobile

```mermaid
graph LR
    subgraph "WEB (Next.js / Vercel)"
        W1[/home]
        W2[/events · /events/id]
        W3[/organizers · /organizers/slug]
        W4[/providers · /providers/id]
        W5[/profile/billets]
        W6[/ticket/token]
        W7[/checkout/eventId]
        W8[/scanner/eventId]
        W9[/on-site-sales/eventId]
        W10[/messages]
        W11[/organizer-studio]
        W12[/my-events/id/statistiques]
        W13[/offer-services]
        W14[/agent/*]
    end

    subgraph "MOBILE (React Native / Expo)"
        M1[tabs/index]
        M2[app/event/id]
        M3[app/organizer/slug]
        M4[app/provider/id]
        M5[tabs/tickets]
        M6[order/eventId/code]
        M7[checkout/eventId]
        M8[scanner.tsx caméra native]
        M9[agent-sales/eventId]
        M10[tabs/messages · conversation/id]
        M11[spaces/organizer.tsx]
        M12[spaces/organizer/eventId/stats]
        M13[spaces/provider.tsx]
        M14[spaces/agent.*]
    end

    W1 <-.->|Équivalent| M1
    W2 <-.->|Équivalent| M2
    W3 <-.->|Équivalent| M3
    W4 <-.->|Équivalent| M4
    W5 <-.->|Équivalent| M5
    W6 <-.->|Lien de secours| M6
    W7 <-.->|Équivalent| M7
    W8 <-.->|Équivalent| M8
    W9 <-.->|Équivalent| M9
    W10 <-.->|Équivalent| M10
    W11 <-.->|Équivalent| M11
    W12 <-.->|Équivalent| M12
    W13 <-.->|Équivalent| M13
    W14 <-.->|Mobile partiel| M14
```

---

## 📌 RÉSUMÉ EXÉCUTIF (Pour Validation Client)

| Flow | Parcours | Statut |
| :--- | :--- | :---: |
| 1 | Authentification & Séparation des Comptes | ✅ Opérationnel |
| 2 | Visiteur Anonyme — Découverte & Navigation Publique | ✅ Opérationnel |
| 3 | Client — Tunnel d'Achat FedaPay (Billetterie FCFA) | ✅ Opérationnel |
| 4 | Client — Portefeuille de Billets & QR Code | ✅ Opérationnel |
| 5 | Organisateur — Création, Gestion & Dashboard Événement | ✅ Opérationnel |
| 6 | Staff Terrain — Scanner d'Entrée & Vente Guichet (Jour J) | ✅ Opérationnel |
| 7 | Prestataire — Vitrine, Abonnement & Mise en Relation | ✅ Opérationnel |
| 8 | Agent / Admin LIB — Back-Office & Modération | ✅ Opérationnel |
| 9 | Messagerie, Social (Amis) & Notifications Multi-canaux | ✅ Opérationnel |
| 10 | Correspondance complète Écrans Web ↔ Mobile (67 écrans) | ✅ Cartographié |
