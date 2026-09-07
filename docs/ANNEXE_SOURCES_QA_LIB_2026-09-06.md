# Annexe : sources et recette mobile LIB

Date : 6 septembre 2026.

Document principal : [Synthèse des exigences](/Users/user/Documents/Code/CLIENT/LIVE_IN_BLACK/LIB_Web/docs/SYNTHESE_EXIGENCES_LIB_2026-09-06.md).

## 1. Les 93 cas mobiles, sans omission de ligne

Source : classeur WhatsApp `00000422-LIVEINBLACK_mobile_QA_interactive.xlsx`. Les intitulés et priorités ci-dessous sont ceux du fichier source. **Résultats non renseignés dans le classeur ; aucun cas n'est déclaré PASS ici.** La dernière colonne est une recommandation d'actualisation, pas un résultat d'exécution.

| ID | Priorité source | Suite | Intitulé source | Adaptation V1 |
|---|---|---|---|---|
| SMK-001 | P0 | Smoke | Installer, lancer, afficher l’accueil sans crash | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SMK-002 | P0 | Smoke | Fermer/rouvrir l’app pendant un chargement | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SMK-003 | P0 | Smoke | Naviguer sur tous les onglets | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SMK-004 | P0 | Smoke | Se connecter avec un compte valide | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SMK-005 | P0 | Smoke | Ouvrir un événement et revenir | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SMK-006 | P0 | Smoke | Acheter une place de test et recevoir le billet | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SMK-007 | P0 | Smoke | Afficher le QR du billet | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SMK-008 | P0 | Smoke | Scanner le QR avec le compte autorisé | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SMK-009 | P1 | Smoke | Envoyer et recevoir un message texte | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SMK-010 | P1 | Smoke | Se déconnecter et perdre l’accès protégé | Conserver ; exécuter sur la V1 et consigner le résultat. |
| AUTH-001 | P0 | Authentification | Connexion valide | Conserver ; exécuter sur la V1 et consigner le résultat. |
| AUTH-002 | P1 | Authentification | Email invalide, champ vide, mot de passe vide | Conserver ; exécuter sur la V1 et consigner le résultat. |
| AUTH-003 | P1 | Authentification | Mauvais mot de passe et message utile | Conserver ; exécuter sur la V1 et consigner le résultat. |
| AUTH-004 | P1 | Authentification | Inscription client valide | Conserver ; exécuter sur la V1 et consigner le résultat. |
| AUTH-005 | P1 | Authentification | Doublon email et mot de passe faible | Étendre : même e-mail interdit entre chacun des trois types ; texte exact demandé. |
| AUTH-006 | P1 | Authentification | Vérification email valide, expirée et déjà utilisée | Conserver ; exécuter sur la V1 et consigner le résultat. |
| AUTH-007 | P1 | Authentification | Mot de passe oublié puis réinitialisation | Conserver ; exécuter sur la V1 et consigner le résultat. |
| AUTH-008 | P0 | Authentification | Session expirée pendant une action | Conserver ; exécuter sur la V1 et consigner le résultat. |
| AUTH-009 | P1 | Authentification | Modification email avec confirmation | Étendre : changement vers une adresse d'un autre compte interdit ; confirmation requise. |
| AUTH-010 | P1 | Authentification | Modification mot de passe | Conserver ; exécuter sur la V1 et consigner le résultat. |
| AUTH-011 | P0 | Authentification | Logout puis deep link protégé | Conserver ; exécuter sur la V1 et consigner le résultat. |
| AUTH-012 | P1 | Authentification | Suppression compte et confirmation destructive | Conserver ; exécuter sur la V1 et consigner le résultat. |
| NAV-001 | P1 | Navigation/UI | Tous les onglets et retours | Conserver ; exécuter sur la V1 et consigner le résultat. |
| NAV-002 | P1 | Navigation/UI | Deep links événement, billet, conversation et checkout | Conserver ; exécuter sur la V1 et consigner le résultat. |
| NAV-003 | P1 | Navigation/UI | Route inconnue et not-found | Conserver ; exécuter sur la V1 et consigner le résultat. |
| NAV-004 | P2 | Navigation/UI | Reprise après background pendant un parcours critique | Conserver ; exécuter sur la V1 et consigner le résultat. |
| UI-001 | P1 | Navigation/UI | Loading, skeleton, empty, error et retry de chaque écran | Conserver ; exécuter sur la V1 et consigner le résultat. |
| UI-002 | P1 | Navigation/UI | Clavier, scroll, safe area, rotation et petit écran | Conserver ; exécuter sur la V1 et consigner le résultat. |
| UI-003 | P1 | Navigation/UI | Texte long, accents, dates, nombres et devises | Conserver ; exécuter sur la V1 et consigner le résultat. |
| UI-004 | P1 | Navigation/UI | Thème clair/sombre et relance | Différé : mode clair non prioritaire le 06/09 ; vérifier le thème retenu en V1. |
| UI-005 | P1 | Navigation/UI | Accessibilité : labels, focus, contraste et taille texte | Conserver ; exécuter sur la V1 et consigner le résultat. |
| EVT-001 | P1 | Événements | Liste accueil et refresh | Conserver ; exécuter sur la V1 et consigner le résultat. |
| EVT-002 | P1 | Événements | Recherche exacte, accents, casse et aucun résultat | Conserver ; exécuter sur la V1 et consigner le résultat. |
| EVT-003 | P1 | Événements | Filtres région, devise, date et catégorie | Adapter : retirer sélection internationale de région/devise ; conserver les filtres pertinents Bénin. |
| EVT-004 | P1 | Événements | Détail événement complet | Conserver ; exécuter sur la V1 et consigner le résultat. |
| EVT-005 | P1 | Événements | Événement gratuit, payant, complet et passé | Adapter : pas d'événement entièrement gratuit selon R58 ; distinguer guestlists et payant/complet/passé. |
| EVT-006 | P1 | Événements | Événement annulé, reporté, verrouillé et revente | Adapter : annulation/report conservés ; revente absente et refusée côté serveur. |
| EVT-007 | P2 | Événements | Maps iOS, Android et fallback web | Conserver ; exécuter sur la V1 et consigner le résultat. |
| EVT-008 | P1 | Événements | Suivi, intérêt, partage, organisateur et playlist | Conserver ; exécuter sur la V1 et consigner le résultat. |
| PAY-001 | P0 | Paiement | Achat gratuit | Remplacer : vérifier absence du parcours d'événement entièrement gratuit ; guestlist distincte. |
| PAY-002 | P0 | Paiement | Achat EUR/Stripe succès | Remplacer : vérifier absence/refus du rail EUR/Stripe en V1 Bénin. |
| PAY-003 | P0 | Paiement | Achat XOF/FedaPay succès | Conserver ; exécuter sur la V1 et consigner le résultat. |
| PAY-004 | P0 | Paiement | Annulation, timeout et erreur paiement | Conserver ; exécuter sur la V1 et consigner le résultat. |
| PAY-005 | P0 | Paiement | Double tap et reprise sans double commande | Conserver ; exécuter sur la V1 et consigner le résultat. |
| PAY-006 | P1 | Paiement | Groupe/table et stock | Conserver ; exécuter sur la V1 et consigner le résultat. |
| PAY-007 | P1 | Paiement | Assurance 10 %, uniquement si applicable | Renommer option d'annulation, pas promesse d'assurance ; seuil 5 000, prix 10 %, plafond 5 000, limite fermeture - 48 h. |
| PAY-008 | P1 | Paiement | Seat hold 24 h, acompte et activation | À préciser : fonction de blocage maintenue ; durée/acompte et tarif du cas restent à confirmer. |
| PAY-009 | P1 | Paiement | Seat hold 72 h, acompte et activation | À préciser : même réserve que PAY-008 pour 72 h. |
| PAY-010 | P1 | Paiement | Paiement solde avant expiration | Conserver, selon configuration finale de blocage. |
| PAY-011 | P1 | Paiement | Expiration hold et libération stock | Conserver ; ne pas confondre expiration d'un blocage et stock d'un billet en remboursement. |
| PAY-012 | P0 | Paiement | Retour WebView succès, annulation et fermeture app | Conserver ; exécuter sur la V1 et consigner le résultat. |
| TKT-001 | P0 | Billets | Wallet vide et wallet rempli | Conserver : portefeuille de billets, pas portefeuille d'argent. |
| TKT-002 | P0 | Billets | Détail billet, QR et deep link | Conserver ; exécuter sur la V1 et consigner le résultat. |
| TKT-003 | P1 | Billets | Revente : création, retrait et annonce publique | Remplacer : impossibilité de créer/retirer une annonce active ; pas de revente publique V1. |
| TKT-004 | P0 | Billets | Achat d’une revente selon devise | Remplacer : achat de revente interdit, y compris API/lien profond. |
| TKT-005 | P1 | Billets | Remboursement autorisé et suivi | Requalifier selon R58 : option, annulation, report, point/code et individuel. |
| TKT-006 | P0 | Billets | Billet scanné bloque le remboursement | Préciser : le billet scanné bloque l'option volontaire ; ne pas extrapoler à tout remboursement exceptionnel. |
| TKT-007 | P1 | Billets | Assurance et événement reporté | Requalifier selon R58 : option et report sont deux causes aux montants/délais différents. |
| SCN-001 | P0 | Scanner/Agent | Permission caméra acceptée et refusée | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SCN-002 | P0 | Scanner/Agent | QR valide, inconnu, expiré et déjà scanné | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SCN-003 | P1 | Scanner/Agent | Saisie manuelle | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SCN-004 | P0 | Scanner/Agent | Client refusé, rôle scanner accepté | Conserver ; l'accès agent est une permission de mission, pas un cumul de profils commerciaux. |
| AGT-001 | P1 | Scanner/Agent | Vente normale agent | Conserver ; exécuter sur la V1 et consigner le résultat. |
| AGT-002 | P1 | Scanner/Agent | Vente à l’entrée | Conserver ; exécuter sur la V1 et consigner le résultat. |
| AGT-003 | P1 | Scanner/Agent | Cash, Mobile Money et opérateurs | Conserver ; arbitrer le mécanisme de règlement cash D87 avant validation. |
| AGT-004 | P1 | Scanner/Agent | Stock insuffisant et échec réseau | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SOC-001 | P1 | Social | Liste conversations et polling | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SOC-002 | P1 | Social | Envoi texte, doublon et message long | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SOC-003 | P1 | Social | Messages non supportés avec fallback | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SOC-004 | P1 | Social | Groupe et membres | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SOC-005 | P1 | Social | Amis : demander, accepter et refuser | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SOC-006 | P1 | Social | Bloquer/débloquer et données isolées | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SOC-007 | P2 | Social | Messages importants | Conserver ; exécuter sur la V1 et consigner le résultat. |
| ROLE-001 | P0 | Rôles | Hub sans rôle, rôle unique et rôles multiples | Remplacer le cumul commercial par trois comptes distincts ; missions d'agents toujours permises. |
| ROLE-002 | P1 | Rôles | Organisateur : liste et détail | Conserver ; exécuter sur la V1 et consigner le résultat. |
| ROLE-003 | P1 | Rôles | Prestataire : profil, abonnement et avis | Annuaire/abonnement confirmés ; qualifier le niveau attendu des avis. |
| ROLE-004 | P1 | Rôles | Agent : dashboard et écrans exposés | Conserver ; exécuter sur la V1 et consigner le résultat. |
| ROLE-005 | P0 | Rôles | Accès interdit par mauvais rôle | Conserver ; tester serveur, URL, API et liens profonds, pas seulement les menus. |
| ROLE-006 | P1 | Rôles | Fonctions v1 non portées non simulées | Conserver ; exécuter sur la V1 et consigner le résultat. |
| APP-001 | P1 | Secondaire | Candidature organisateur | Nouveau compte organisateur indépendant ; pièce du titulaire seulement sur le parcours visé. |
| APP-002 | P1 | Secondaire | Candidature prestataire | Nouveau compte prestataire indépendant ; supprimer champ entreprise et étape Tarifs visés. |
| APP-003 | P1 | Secondaire | Legal, privacy, terms et cookies | Conserver ; exécuter sur la V1 et consigner le résultat. |
| NET-001 | P1 | Réseau/Sécurité | Hors-ligne à l’ouverture | Conserver ; exécuter sur la V1 et consigner le résultat. |
| NET-002 | P0 | Réseau/Sécurité | Hors-ligne pendant POST paiement/scan | Conserver ; exécuter sur la V1 et consigner le résultat. |
| NET-003 | P1 | Réseau/Sécurité | Réseau faible et retry | Conserver ; exécuter sur la V1 et consigner le résultat. |
| NET-004 | P1 | Réseau/Sécurité | Double action après timeout | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SEC-001 | P0 | Réseau/Sécurité | Isolation des comptes par URL/API | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SEC-002 | P0 | Réseau/Sécurité | Tokens, cookies et secrets absents des logs/UI | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SEC-003 | P0 | Réseau/Sécurité | Expiration et révocation de session | Conserver ; exécuter sur la V1 et consigner le résultat. |
| SEC-004 | P1 | Réseau/Sécurité | Notifications et deep links sans fuite | Conserver ; exécuter sur la V1 et consigner le résultat. |
| PERF-001 | P1 | Réseau/Sécurité | 20 ouvertures/navigations sans crash | Conserver ; exécuter sur la V1 et consigner le résultat. |
| PERF-002 | P1 | Réseau/Sécurité | Rendu initial, liste, détail et wallet mesurés | Conserver ; exécuter sur la V1 et consigner le résultat. |
| PERF-003 | P1 | Réseau/Sécurité | Batterie faible et espace disque faible | Conserver ; exécuter sur la V1 et consigner le résultat. |

## 2. Compléments nécessaires à la recette

- Unicité globale des e-mails : les trois types, concurrence, casse/normalisation, changement d'adresse et message exact.
- Interdiction de conversion/ajout de profil/bascule de type depuis une connexion existante ; maintien des permissions de mission d'agents.
- Suppression effective des champs entreprise, justificatifs entourés, étape Tarifs ; œil et confirmation mot de passe desktop.
- Absence d'e-mail de message quand connecté, absence d'envoi par message, rappel après attente ou accumulation selon paramètres arrêtés, annulation d'un rappel devenu inutile et anti-doublons.
- Paiement FedaPay réussi de bout en bout, répartition prouvée et gestion des retours/webhooks répétés.
- Bénin-only sur catalogue/données/menus/blog, XOF dans tous les montants, pas d'EUR simplement renommé.
- Option au facial 4 999 / 5 000, plafond, fermeture - 48 h à la seconde exacte ; pas calculée sur le début de l'événement.
- Report : nouvelle date requise, maintien du billet, expiration notification + 24 h, refus irréversible.
- Annulation : un seul dossier par commande payée, ventes cash incluses, reprise du traitement après échec, QR invalidé atomiquement.
- Retrait : point autorisé, code invalide/déjà utilisé, tentatives concurrentes, signature obligatoire, caisse, confidentialité.
- Bascule « Je ne peux pas me déplacer » : code supprimé de la file agent et impossible à utiliser ensuite.
- Destination du remboursement individuel conforme au paiement d'origine, compte du bénéficiaire vérifié, preuve non remplaçable silencieusement.
- Contestation : montant/référence inchangés, aucune double dette, pas de double paiement automatique, billet toujours invalide.
- Stock du billet annulé volontairement non remis en vente avant validation du remboursement.
- Filtres et compteurs déconnecté/connecté, Maps web/iOS/Android, blog visible, statistiques ventes/consommations cohérentes.
- Données de test propres, non mixtes et non étrangères au périmètre par défaut ; aucun secret dans les preuves.

## 3. Autres feuilles du classeur

- Tableau de bord : total 93, résultats à saisir. Son indicateur non-exécutés affiché à zéro est incohérent avec les statuts vides.
- Gate de sortie : tous P0/P1 applicables passés, aucun crash ni problème sécurité/paiement ouvert, exceptions documentées. Remplacer le gate historique « paiement EUR/XOF » par le périmètre FedaPay/XOF.
- Appareils : iPhone compact et récent, Android compact et récent, versions minimales supportées et récentes, réseau faible 3G/edge, hors ligne, texte agrandi et lecteur d'écran.
- Bugs : identifiant, gravité, statut, titre, build, plateforme/appareil/OS, environnement, cas lié, reproduction, attendu, obtenu, preuve.
- Paramètres : statuts À faire/PASS/FAIL/BLOCKED/N/A ; priorités P0-P3 ; cycle de bug Nouveau/À reproduire/Confirmé/Corrigé/Rejeté/Bloqué.
- Définitions source : P0 crash/perte argent ou billet/auth compromise/fuite ; P1 parcours principal impossible sans contournement ; P2 fonction importante dégradée avec contournement ; P3 secondaire/visuel/texte.

## 4. Registre des pièces jointes

Les liens pointent vers les exports originaux sur cette machine. « Inventorié » n'implique pas que le contenu intégral du média a été analysé. Les fichiers de configuration et les secrets ne sont pas reproduits.

### WhatsApp Chat - Live In Black

| Fichier | Traitement |
|---|---|
| [00000003-PHOTO-2026-08-20-11-33-26.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000003-PHOTO-2026-08-20-11-33-26.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000004-PHOTO-2026-08-20-11-33-27.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000004-PHOTO-2026-08-20-11-33-27.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000005-PHOTO-2026-08-20-11-33-27.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000005-PHOTO-2026-08-20-11-33-27.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000006-PHOTO-2026-08-20-11-33-27.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000006-PHOTO-2026-08-20-11-33-27.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000007-PHOTO-2026-08-20-11-33-28.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000007-PHOTO-2026-08-20-11-33-28.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000008-PHOTO-2026-08-20-11-33-28.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000008-PHOTO-2026-08-20-11-33-28.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000009-PHOTO-2026-08-20-11-33-28.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000009-PHOTO-2026-08-20-11-33-28.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000010-PHOTO-2026-08-20-11-33-28.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000010-PHOTO-2026-08-20-11-33-28.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000011-PHOTO-2026-08-20-11-33-28.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000011-PHOTO-2026-08-20-11-33-28.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000012-PHOTO-2026-08-20-11-33-28.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000012-PHOTO-2026-08-20-11-33-28.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000013-PHOTO-2026-08-20-11-33-28.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000013-PHOTO-2026-08-20-11-33-28.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000014-PHOTO-2026-08-20-11-33-30.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000014-PHOTO-2026-08-20-11-33-30.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000015-PHOTO-2026-08-20-11-33-32.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000015-PHOTO-2026-08-20-11-33-32.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000017-PHOTO-2026-08-20-11-33-33.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000017-PHOTO-2026-08-20-11-33-33.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000018-PHOTO-2026-08-20-11-33-33.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000018-PHOTO-2026-08-20-11-33-33.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000077-AUDIO-2026-08-21-12-48-25.opus](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000077-AUDIO-2026-08-21-12-48-25.opus>) | Vocal inventorié, non transcrit : couverture à compléter. |
| [00000081-AUDIO-2026-08-21-12-49-31.opus](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000081-AUDIO-2026-08-21-12-49-31.opus>) | Vocal inventorié, non transcrit : couverture à compléter. |
| [00000085-AUDIO-2026-08-21-12-51-19.opus](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000085-AUDIO-2026-08-21-12-51-19.opus>) | Vocal inventorié, non transcrit : couverture à compléter. |
| [00000087-LIVE_IN_BLACK_Achat_Tickets_Hors_Application_CORRIGE.docx](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000087-LIVE_IN_BLACK_Achat_Tickets_Hors_Application_CORRIGE.docx>) | Texte exploité ; portée actuelle/historique qualifiée dans la synthèse. |
| [00000088-LIVE_IN_BLACK_Dossier_Partenaires_CORRIGE.docx](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000088-LIVE_IN_BLACK_Dossier_Partenaires_CORRIGE.docx>) | Texte exploité ; portée actuelle/historique qualifiée dans la synthèse. |
| [00000089-LIVE_IN_BLACK_Dossier_Prestataires_CORRIGE.docx](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000089-LIVE_IN_BLACK_Dossier_Prestataires_CORRIGE.docx>) | Texte exploité ; portée actuelle/historique qualifiée dans la synthèse. |
| [00000090-LIVE_IN_BLACK_Modele_Economique_CORRIGE.docx](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000090-LIVE_IN_BLACK_Modele_Economique_CORRIGE.docx>) | Texte exploité ; portée actuelle/historique qualifiée dans la synthèse. |
| [00000091-LIVE_IN_BLACK_Politique_Annulation_Remboursement.docx](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000091-LIVE_IN_BLACK_Politique_Annulation_Remboursement.docx>) | Texte exploité ; portée actuelle/historique qualifiée dans la synthèse. |
| [00000092-LIVE_IN_BLACK_Systeme_de_revente_CORRIGE.docx](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000092-LIVE_IN_BLACK_Systeme_de_revente_CORRIGE.docx>) | Texte exploité ; portée actuelle/historique qualifiée dans la synthèse. |
| [00000093-LIVE_IN_BLACK_Systeme_de_Versement_Anticipe.docx](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000093-LIVE_IN_BLACK_Systeme_de_Versement_Anticipe.docx>) | Texte exploité ; portée actuelle/historique qualifiée dans la synthèse. |
| [00000099-LIVE_IN_BLACK_Preview.apk](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000099-LIVE_IN_BLACK_Preview.apk>) | Build inventorié, non exécuté pour cette synthèse. |
| [00000118-PHOTO-2026-08-26-15-57-43.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000118-PHOTO-2026-08-26-15-57-43.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000119-PHOTO-2026-08-26-15-57-44.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000119-PHOTO-2026-08-26-15-57-44.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000120-PHOTO-2026-08-26-15-57-44.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000120-PHOTO-2026-08-26-15-57-44.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000121-PHOTO-2026-08-26-15-57-44.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000121-PHOTO-2026-08-26-15-57-44.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000123-rapport-client-avancement-live-in-black-2026-08-12-26.pdf](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000123-rapport-client-avancement-live-in-black-2026-08-12-26.pdf>) | Texte exploité ; bilan/QA/catalogue distingués des décisions. |
| [00000124-LIVE-IN-BLACK-catalogue-emails.pdf](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000124-LIVE-IN-BLACK-catalogue-emails.pdf>) | Texte exploité ; bilan/QA/catalogue distingués des décisions. |
| [00000127-Live-In-Black-logo-pack.zip](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000127-Live-In-Black-logo-pack.zip>) | Pack de logos inventorié ; choix de marque repris depuis les échanges. |
| [00000128-LIB-logo-preview.png](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000128-LIB-logo-preview.png>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000144-PHOTO-2026-08-28-14-48-47.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000144-PHOTO-2026-08-28-14-48-47.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000145-PHOTO-2026-08-28-14-48-48.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000145-PHOTO-2026-08-28-14-48-48.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000146-PHOTO-2026-08-28-14-48-48.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000146-PHOTO-2026-08-28-14-48-48.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000147-PHOTO-2026-08-28-14-48-48.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000147-PHOTO-2026-08-28-14-48-48.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000148-PHOTO-2026-08-28-14-48-48.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000148-PHOTO-2026-08-28-14-48-48.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000149-PHOTO-2026-08-28-14-48-48.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000149-PHOTO-2026-08-28-14-48-48.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000150-PHOTO-2026-08-28-14-48-48.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000150-PHOTO-2026-08-28-14-48-48.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000151-PHOTO-2026-08-28-14-48-48.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000151-PHOTO-2026-08-28-14-48-48.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000152-PHOTO-2026-08-28-14-48-48.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000152-PHOTO-2026-08-28-14-48-48.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000153-PHOTO-2026-08-28-14-48-48.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000153-PHOTO-2026-08-28-14-48-48.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000154-PHOTO-2026-08-28-14-48-48.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000154-PHOTO-2026-08-28-14-48-48.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000155-PHOTO-2026-08-28-14-48-48.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000155-PHOTO-2026-08-28-14-48-48.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000156-PHOTO-2026-08-28-14-48-49.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000156-PHOTO-2026-08-28-14-48-49.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000157-PHOTO-2026-08-28-14-48-49.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000157-PHOTO-2026-08-28-14-48-49.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000158-PHOTO-2026-08-28-14-48-49.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000158-PHOTO-2026-08-28-14-48-49.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000159-PHOTO-2026-08-28-14-48-49.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000159-PHOTO-2026-08-28-14-48-49.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000160-PHOTO-2026-08-28-14-48-49.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000160-PHOTO-2026-08-28-14-48-49.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000161-PHOTO-2026-08-28-14-48-49.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000161-PHOTO-2026-08-28-14-48-49.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000162-PHOTO-2026-08-28-14-48-49.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000162-PHOTO-2026-08-28-14-48-49.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000163-PHOTO-2026-08-28-14-48-49.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000163-PHOTO-2026-08-28-14-48-49.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000164-PHOTO-2026-08-28-14-48-49.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000164-PHOTO-2026-08-28-14-48-49.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000165-PHOTO-2026-08-28-14-48-49.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000165-PHOTO-2026-08-28-14-48-49.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000166-PHOTO-2026-08-28-14-48-49.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000166-PHOTO-2026-08-28-14-48-49.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000167-PHOTO-2026-08-28-14-48-49.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000167-PHOTO-2026-08-28-14-48-49.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000168-PHOTO-2026-08-28-14-48-50.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000168-PHOTO-2026-08-28-14-48-50.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000169-PHOTO-2026-08-28-14-48-50.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000169-PHOTO-2026-08-28-14-48-50.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000170-PHOTO-2026-08-28-14-48-50.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000170-PHOTO-2026-08-28-14-48-50.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000171-PHOTO-2026-08-28-14-48-50.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000171-PHOTO-2026-08-28-14-48-50.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000172-PHOTO-2026-08-28-14-48-50.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000172-PHOTO-2026-08-28-14-48-50.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000173-PHOTO-2026-08-28-14-48-51.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000173-PHOTO-2026-08-28-14-48-51.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000174-PHOTO-2026-08-28-14-48-51.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000174-PHOTO-2026-08-28-14-48-51.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000175-PHOTO-2026-08-28-14-48-51.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000175-PHOTO-2026-08-28-14-48-51.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000176-PHOTO-2026-08-28-14-48-51.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000176-PHOTO-2026-08-28-14-48-51.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000177-PHOTO-2026-08-28-14-48-51.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000177-PHOTO-2026-08-28-14-48-51.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000178-PHOTO-2026-08-28-14-48-51.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000178-PHOTO-2026-08-28-14-48-51.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000179-PHOTO-2026-08-28-14-48-51.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000179-PHOTO-2026-08-28-14-48-51.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000180-PHOTO-2026-08-28-14-48-52.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000180-PHOTO-2026-08-28-14-48-52.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000181-PHOTO-2026-08-28-14-48-52.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000181-PHOTO-2026-08-28-14-48-52.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000182-PHOTO-2026-08-28-14-48-52.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000182-PHOTO-2026-08-28-14-48-52.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000183-PHOTO-2026-08-28-14-48-52.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000183-PHOTO-2026-08-28-14-48-52.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000184-PHOTO-2026-08-28-14-48-52.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000184-PHOTO-2026-08-28-14-48-52.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000185-PHOTO-2026-08-28-14-48-52.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000185-PHOTO-2026-08-28-14-48-52.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000186-PHOTO-2026-08-28-14-48-52.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000186-PHOTO-2026-08-28-14-48-52.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000187-PHOTO-2026-08-28-14-48-52.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000187-PHOTO-2026-08-28-14-48-52.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000188-PHOTO-2026-08-28-14-48-52.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000188-PHOTO-2026-08-28-14-48-52.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000189-PHOTO-2026-08-28-14-48-53.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000189-PHOTO-2026-08-28-14-48-53.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000190-PHOTO-2026-08-28-14-48-53.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000190-PHOTO-2026-08-28-14-48-53.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000191-PHOTO-2026-08-28-14-48-53.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000191-PHOTO-2026-08-28-14-48-53.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000192-PHOTO-2026-08-28-14-48-53.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000192-PHOTO-2026-08-28-14-48-53.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000193-PHOTO-2026-08-28-14-48-53.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000193-PHOTO-2026-08-28-14-48-53.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000194-PHOTO-2026-08-28-14-48-53.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000194-PHOTO-2026-08-28-14-48-53.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000195-PHOTO-2026-08-28-14-48-53.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000195-PHOTO-2026-08-28-14-48-53.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000196-PHOTO-2026-08-28-14-48-53.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000196-PHOTO-2026-08-28-14-48-53.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000197-PHOTO-2026-08-28-14-48-53.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000197-PHOTO-2026-08-28-14-48-53.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000198-PHOTO-2026-08-28-14-48-53.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000198-PHOTO-2026-08-28-14-48-53.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000199-PHOTO-2026-08-28-14-48-54.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000199-PHOTO-2026-08-28-14-48-54.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000200-PHOTO-2026-08-28-14-48-54.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000200-PHOTO-2026-08-28-14-48-54.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000201-PHOTO-2026-08-28-14-48-54.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000201-PHOTO-2026-08-28-14-48-54.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000202-PHOTO-2026-08-28-14-48-54.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000202-PHOTO-2026-08-28-14-48-54.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000203-PHOTO-2026-08-28-14-48-54.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000203-PHOTO-2026-08-28-14-48-54.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000204-PHOTO-2026-08-28-14-48-54.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000204-PHOTO-2026-08-28-14-48-54.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000205-PHOTO-2026-08-28-14-48-54.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000205-PHOTO-2026-08-28-14-48-54.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000213-PHOTO-2026-08-29-08-20-17.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000213-PHOTO-2026-08-29-08-20-17.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000216-PHOTO-2026-08-29-11-13-30.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000216-PHOTO-2026-08-29-11-13-30.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000219-PHOTO-2026-08-30-15-15-16.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000219-PHOTO-2026-08-30-15-15-16.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000224-PHOTO-2026-08-30-15-53-47.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000224-PHOTO-2026-08-30-15-53-47.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000225-PHOTO-2026-08-30-15-53-47.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000225-PHOTO-2026-08-30-15-53-47.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000226-PHOTO-2026-08-30-15-53-47.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000226-PHOTO-2026-08-30-15-53-47.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000227-PHOTO-2026-08-30-15-53-47.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000227-PHOTO-2026-08-30-15-53-47.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000228-PHOTO-2026-08-30-15-53-47.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000228-PHOTO-2026-08-30-15-53-47.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000229-PHOTO-2026-08-30-15-53-48.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000229-PHOTO-2026-08-30-15-53-48.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000240-AUDIO-2026-08-30-19-45-16.opus](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000240-AUDIO-2026-08-30-19-45-16.opus>) | Vocal inventorié, non transcrit : couverture à compléter. |
| [00000243-PHOTO-2026-08-30-19-53-35.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000243-PHOTO-2026-08-30-19-53-35.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000244-PHOTO-2026-08-30-19-53-35.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000244-PHOTO-2026-08-30-19-53-35.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000245-PHOTO-2026-08-30-19-53-36.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000245-PHOTO-2026-08-30-19-53-36.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000246-PHOTO-2026-08-30-19-53-36.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000246-PHOTO-2026-08-30-19-53-36.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000247-PHOTO-2026-08-30-19-53-36.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000247-PHOTO-2026-08-30-19-53-36.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000281-AUDIO-2026-08-31-19-04-45.opus](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000281-AUDIO-2026-08-31-19-04-45.opus>) | Vocal inventorié, non transcrit : couverture à compléter. |
| [00000289-screencapture-Users-user-Documents-Code-CLIENT-LIVE-IN-BLACK-LIB-Web-docs-design-emails-previe-2026-09-01-10_02_03.pdf](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000289-screencapture-Users-user-Documents-Code-CLIENT-LIVE-IN-BLACK-LIB-Web-docs-design-emails-previe-2026-09-01-10_02_03.pdf>) | Aperçu graphique consulté ; pas de transcription intégrale du PDF image. |
| Fichier d'environnement | Non exploité ; secrets exclus de la synthèse. |
| [00000311-PHOTO-2026-09-03-17-35-54.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000311-PHOTO-2026-09-03-17-35-54.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000312-PHOTO-2026-09-03-17-35-55.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000312-PHOTO-2026-09-03-17-35-55.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000313-PHOTO-2026-09-03-17-36-43.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000313-PHOTO-2026-09-03-17-36-43.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000314-PHOTO-2026-09-03-17-38-04.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000314-PHOTO-2026-09-03-17-38-04.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000315-PHOTO-2026-09-03-17-39-40.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000315-PHOTO-2026-09-03-17-39-40.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000316-PHOTO-2026-09-03-17-42-16.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000316-PHOTO-2026-09-03-17-42-16.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000317-PHOTO-2026-09-03-17-45-19.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000317-PHOTO-2026-09-03-17-45-19.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000318-PHOTO-2026-09-03-17-45-19.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000318-PHOTO-2026-09-03-17-45-19.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000319-PHOTO-2026-09-03-18-07-23.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000319-PHOTO-2026-09-03-18-07-23.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000320-PHOTO-2026-09-03-18-09-49.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000320-PHOTO-2026-09-03-18-09-49.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000321-PHOTO-2026-09-03-18-21-14.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000321-PHOTO-2026-09-03-18-21-14.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000322-PHOTO-2026-09-03-18-23-39.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000322-PHOTO-2026-09-03-18-23-39.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000342-PHOTO-2026-09-03-19-26-27.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000342-PHOTO-2026-09-03-19-26-27.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000346-PHOTO-2026-09-03-19-29-22.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000346-PHOTO-2026-09-03-19-29-22.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000365-PHOTO-2026-09-03-19-47-15.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000365-PHOTO-2026-09-03-19-47-15.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000369-AUDIO-2026-09-03-19-48-52.opus](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000369-AUDIO-2026-09-03-19-48-52.opus>) | Vocal inventorié, non transcrit : couverture à compléter. |
| [00000384-LIB_remarques_V1_Benin.docx](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000384-LIB_remarques_V1_Benin.docx>) | Texte exploité ; portée actuelle/historique qualifiée dans la synthèse. |
| [00000386-VIDEO-2026-09-04-14-14-42.mp4](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000386-VIDEO-2026-09-04-14-14-42.mp4>) | Vidéo inventoriée, non transcrite ni analysée intégralement ; contexte des messages exploité. |
| [00000387-PHOTO-2026-09-04-14-14-59.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000387-PHOTO-2026-09-04-14-14-59.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000388-PHOTO-2026-09-04-14-15-16.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000388-PHOTO-2026-09-04-14-15-16.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000389-VIDEO-2026-09-04-14-16-02.mp4](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000389-VIDEO-2026-09-04-14-16-02.mp4>) | Vidéo inventoriée, non transcrite ni analysée intégralement ; contexte des messages exploité. |
| [00000390-VIDEO-2026-09-04-14-19-09.mp4](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000390-VIDEO-2026-09-04-14-19-09.mp4>) | Vidéo inventoriée, non transcrite ni analysée intégralement ; contexte des messages exploité. |
| [00000391-VIDEO-2026-09-04-14-19-51.mp4](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000391-VIDEO-2026-09-04-14-19-51.mp4>) | Vidéo inventoriée, non transcrite ni analysée intégralement ; contexte des messages exploité. |
| [00000418-PHOTO-2026-09-04-17-23-22.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000418-PHOTO-2026-09-04-17-23-22.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000422-LIVEINBLACK_mobile_QA_interactive.xlsx](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000422-LIVEINBLACK_mobile_QA_interactive.xlsx>) | 93 cas et autres feuilles extraits ; résultats non renseignés. |
| [00000441-VIDEO-2026-09-05-12-10-17.mp4](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000441-VIDEO-2026-09-05-12-10-17.mp4>) | Vidéo inventoriée, non transcrite ni analysée intégralement ; contexte des messages exploité. |
| [00000442-VIDEO-2026-09-05-12-10-31.mp4](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000442-VIDEO-2026-09-05-12-10-31.mp4>) | Vidéo inventoriée, non transcrite ni analysée intégralement ; contexte des messages exploité. |
| [00000443-VIDEO-2026-09-05-12-10-55.mp4](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000443-VIDEO-2026-09-05-12-10-55.mp4>) | Vidéo inventoriée, non transcrite ni analysée intégralement ; contexte des messages exploité. |
| [00000444-VIDEO-2026-09-05-12-11-19.mp4](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000444-VIDEO-2026-09-05-12-11-19.mp4>) | Vidéo inventoriée, non transcrite ni analysée intégralement ; contexte des messages exploité. |
| [00000460-VIDEO-2026-09-05-12-57-04.mp4](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000460-VIDEO-2026-09-05-12-57-04.mp4>) | Vidéo inventoriée, non transcrite ni analysée intégralement ; contexte des messages exploité. |
| [00000462-PHOTO-2026-09-05-12-59-40.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000462-PHOTO-2026-09-05-12-59-40.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000468-PHOTO-2026-09-05-13-28-40.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000468-PHOTO-2026-09-05-13-28-40.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000469-PHOTO-2026-09-05-13-28-40.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000469-PHOTO-2026-09-05-13-28-40.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000470-PHOTO-2026-09-05-13-28-41.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000470-PHOTO-2026-09-05-13-28-41.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000471-PHOTO-2026-09-05-13-28-41.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000471-PHOTO-2026-09-05-13-28-41.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000472-PHOTO-2026-09-05-13-28-41.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000472-PHOTO-2026-09-05-13-28-41.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000476-PHOTO-2026-09-05-13-50-02.jpg](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000476-PHOTO-2026-09-05-13-50-02.jpg>) | Capture clé consultée visuellement et rapprochée de la demande. |
| [00000488-VIDEO-2026-09-05-15-58-01.mp4](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000488-VIDEO-2026-09-05-15-58-01.mp4>) | Vidéo inventoriée, non transcrite ni analysée intégralement ; contexte des messages exploité. |
| [00000502-LIB - Remarques 05-09-2026.docx](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000502-LIB - Remarques 05-09-2026.docx>) | Texte exploité ; portée actuelle/historique qualifiée dans la synthèse. |
| [00000508-QA_Benin_LIB_WEB_V1_bilan_20260906 .pdf](</Users/user/Downloads/WhatsApp Chat - Live In Black/00000508-QA_Benin_LIB_WEB_V1_bilan_20260906 .pdf>) | Texte exploité ; bilan/QA/catalogue distingués des décisions. |
| [_chat.txt](</Users/user/Downloads/WhatsApp Chat - Live In Black/_chat.txt>) | Conversation exploitée ; messages supprimés non récupérables, secrets omis. |
### WhatsApp Chat - Chady Hage Prospect

| Fichier | Traitement |
|---|---|
| [00000012-PHOTO-2026-08-28-17-31-23.jpg](</Users/user/Downloads/WhatsApp Chat - Chady Hage Prospect/00000012-PHOTO-2026-08-28-17-31-23.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000013-PHOTO-2026-08-28-17-31-24.jpg](</Users/user/Downloads/WhatsApp Chat - Chady Hage Prospect/00000013-PHOTO-2026-08-28-17-31-24.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000014-PHOTO-2026-08-28-17-31-24.jpg](</Users/user/Downloads/WhatsApp Chat - Chady Hage Prospect/00000014-PHOTO-2026-08-28-17-31-24.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000032-PHOTO-2026-08-30-07-59-22.jpg](</Users/user/Downloads/WhatsApp Chat - Chady Hage Prospect/00000032-PHOTO-2026-08-30-07-59-22.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000042-PHOTO-2026-08-31-17-30-17.jpg](</Users/user/Downloads/WhatsApp Chat - Chady Hage Prospect/00000042-PHOTO-2026-08-31-17-30-17.jpg>) | Image inventoriée ; contexte textuel exploité si présent, pas de lecture détaillée individuelle garantie. |
| [00000058-Remboursement Annulation et Report.docx](</Users/user/Downloads/WhatsApp Chat - Chady Hage Prospect/00000058-Remboursement Annulation et Report.docx>) | Texte exploité ; portée actuelle/historique qualifiée dans la synthèse. |
| [_chat.txt](</Users/user/Downloads/WhatsApp Chat - Chady Hage Prospect/_chat.txt>) | Conversation exploitée ; messages supprimés non récupérables, secrets omis. |

## 5. Limites d'exhaustivité

162 fichiers recensés dans les deux dossiers. Les 6 vocaux, 10 vidéos, certaines images et 2 messages supprimés empêchent de garantir qu'aucune demande uniquement orale/visuelle n'a été omise. Il n'y a pas de transcription inventée ni de conclusion de conformité dérivée du simple inventaire. Le PDF QA fourni séparément dans Downloads correspond au bilan également présent dans le groupe ; il n'est pas compté une deuxième fois dans ces 162 fichiers.

