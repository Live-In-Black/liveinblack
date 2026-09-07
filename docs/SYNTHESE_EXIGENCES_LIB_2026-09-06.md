# LIVE IN BLACK : synthèse consolidée des demandes et exigences

**Arrêté documentaire : 6 septembre 2026.** Sources : échanges WhatsApp du groupe Live In Black et de Chady, pièces jointes, rapport QA Bénin, et demandes formulées dans cette conversation.

Annexe : [93 cas mobiles et registre des pièces jointes](/Users/user/Documents/Code/CLIENT/LIVE_IN_BLACK/LIB_Web/docs/ANNEXE_SOURCES_QA_LIB_2026-09-06.md).

Ce document recense les demandes identifiées, les règles métier, les anomalies signalées, les décisions remplacées et les points restant à arbitrer. **Ce n'est ni une attestation de conformité du code, ni une validation de la production.** Aucune correction applicative n'a été réalisée dans le cadre de cette synthèse.

## 1. Méthode et couverture

- **Confirmé** : décision explicite du porteur du projet, notamment les messages des 31 août, 3 et 5 septembre, ou règle du dossier fonctionnel non contredite ensuite.
- **Spécifié historiquement** : détail fourni dans un ancien dossier, à conserver dans la mémoire du projet sans présumer qu'il reste intégralement dans la V1.
- **Signalé en QA** : observation du testeur à la date du test ; pas une reproduction effectuée pour cette synthèse.
- **Proposé / à arbitrer** : suggestion, valeur illustrative, contradiction ou précision absente des sources.
- **Remplacé / exclu / différé** : ne doit pas être réintroduit comme exigence actuelle.

Une demande directe de Chady accompagnée d'une capture prime sur un compte rendu qui la retranscrit incorrectement. Une annonce « corrigé », un push ou un test unitaire réussi ne prouvent pas que le parcours métier est conforme et déployé.

### Sources et références utilisées

| Référence | Source |
|---|---|
| G | Export `_chat.txt`, groupe WhatsApp Live In Black, du 19 août au 6 septembre 2026 |
| P | Export `_chat.txt`, conversation privée Chady Hage Prospect, du 28 août au 6 septembre 2026 |
| ICI | Demandes directes dans cette conversation : notifications, Bénin, comptes séparés et synthèse |
| D87 | `00000087-LIVE_IN_BLACK_Achat_Tickets_Hors_Application_CORRIGE.docx`, partagé le 21 août |
| D88 | `00000088-LIVE_IN_BLACK_Dossier_Partenaires_CORRIGE.docx`, partagé le 21 août |
| D89 | `00000089-LIVE_IN_BLACK_Dossier_Prestataires_CORRIGE.docx`, partagé le 21 août |
| D90 | `00000090-LIVE_IN_BLACK_Modele_Economique_CORRIGE.docx`, partagé le 21 août |
| D91 | `00000091-LIVE_IN_BLACK_Politique_Annulation_Remboursement.docx`, ancienne politique |
| D92 | `00000092-LIVE_IN_BLACK_Systeme_de_revente_CORRIGE.docx`, historique, exclu V1 |
| D93 | `00000093-LIVE_IN_BLACK_Systeme_de_Versement_Anticipe.docx`, historique, exclu V1 |
| R58 | Conversation privée : `00000058-Remboursement Annulation et Report.docx`, version 1.1 du 31 août, nouvelle référence remboursements |
| R384 | `00000384-LIB_remarques_V1_Benin.docx`, compilation du 4 septembre, comportant des écarts aux demandes directes |
| R502 | `00000502-LIB - Remarques 05-09-2026.docx`, compilation du 5 septembre |
| QA | `00000508-QA_Benin_LIB_WEB_V1_bilan_20260906 .pdf`, bilan de production et retest du 6 septembre ; également fourni séparément dans cette conversation |
| MOB | `00000422-LIVEINBLACK_mobile_QA_interactive.xlsx`, 93 cas de recette |
| AV | `00000123-rapport-client-avancement-live-in-black-2026-08-12-26.pdf`, bilan déclaratif du 12 au 26 août |
| EM | `00000124-LIVE-IN-BLACK-catalogue-emails.pdf`, 59 pages, 58 scénarios d'e-mails |
| EM2 | `00000289-screencapture-…2026-09-01-10_02_03.pdf`, aperçu graphique des e-mails du 1er septembre |

Les captures sont identifiées ci-dessous par le numéro au début de leur nom de fichier. L'annexe fournit les chemins des pièces et les 93 cas mobiles.

### Limites à ne pas masquer

Les deux dossiers contiennent 162 fichiers : 2 exports texte, 10 DOCX, 4 PDF, 1 XLSX, 125 JPG, 1 PNG, 6 fichiers audio, 10 vidéos, 1 archive de logos, 1 APK et 1 fichier d'environnement. Les documents textuels ont été exploités ; les captures clés annotées ont été consultées. L'aperçu EM2 a été examiné visuellement pour sa composition et sa palette, pas transcrit mot à mot.

**Les 6 vocaux et les 10 vidéos ne sont pas transcrits. Toutes les images non annotées n'ont pas fait l'objet d'une lecture détaillée individuelle. Deux messages ont été supprimés des exports.** Il n'est donc pas possible de garantir l'exhaustivité d'une demande qui existerait uniquement dans ces médias ou messages manquants. Les archives et l'APK ne constituent pas une preuve de fonctionnement. Les mots de passe, secrets d'environnement et coordonnées personnelles de test sont volontairement exclus.

## 2. Décisions structurantes en vigueur

| ID | Exigence retenue | Source |
|---|---|---|
| V1-01 | Marketplace de l'événementiel réunissant public, organisateurs et prestataires. | G 05/09 13:48 |
| V1-02 | Lancement uniquement au Bénin, pas une ouverture simultanée à l'Afrique de l'Ouest ou à la France. | P 31/08 ; G 03 et 05/09 ; ICI |
| V1-03 | Montants en franc CFA BCEAO, code XOF, affichage FCFA. | R58 ; G 05/09 |
| V1-04 | Site web, application iPhone sur App Store et application Android sur Google Play. | G 05/09 |
| V1-05 | FedaPay Marketplace pour les paiements en ligne, répartition au moment du paiement. | R58 ; G 03 et 05/09 |
| V1-06 | Aucun versement à J+5, aucun versement différé après événement, aucune avance de 50 %. | R58 ; G 03/09 |
| V1-07 | Pas de revente de billets dans la V1. | G 03 et 05/09 |
| V1-08 | Pas de portefeuille d'argent ni de points de fidélité dans la V1. « Mes billets » reste nécessaire. | G 05/09 |
| V1-09 | Trois types de comptes indépendants, chacun avec son adresse e-mail et son mot de passe. | G 05/09 14:24 ; ICI |
| V1-10 | Les missions d'équipe des agents restent des permissions ; elles ne constituent pas une exception autorisant le cumul client/organisateur/prestataire. | G 05/09 14:24 |
| V1-11 | L'organisateur finance et exécute les remboursements ; LIB automatise leur suivi, pas le paiement à sa place. | R58 ; G 05/09 |
| V1-12 | Prestataires : abonnement de 9 000 FCFA/mois, relation et paiement de la prestation directement entre les parties. | D90 ; G 05/09 |

## 3. Bénin, données et contenu

**Exigences :**

- BEN-01 : retirer les sélecteurs de pays/régions destinés à une ouverture internationale. Chady le demande explicitement sur l'annuaire prestataires et la liste organisateurs, captures 468 et 470 ; la conversation privée vise l'ensemble des sections pays/régions.
- BEN-02 : les événements, établissements, prestataires et contenus publics proposés au lancement doivent correspondre au Bénin. Lyon, Paris, Lomé, Dakar, Abidjan et les autres localités étrangères ne deviennent pas conformes parce qu'elles utilisent le FCFA.
- BEN-03 : harmoniser la devise dans les cartes, accueil, listes, fiches, choix de billets, paniers, paiements, billets, formulaires, abonnements, tableaux de bord et communications.
- BEN-04 : distinguer une mauvaise étiquette monétaire d'un véritable prix enregistré en EUR. Remplacer « € » par « FCFA » sans contrôler les données n'est pas une conversion financière valide.
- BEN-05 : traiter les données de démonstration et historiques hors périmètre sans corrompre des commandes réelles ni leurs montants d'origine. Le traitement précis des données existantes reste une décision de migration, pas une autorisation de suppression globale.
- BEN-06 : publier les quelque 100 articles Bénin annoncés comme préparés. « Préparés » ne signifie pas visibles au public ; la QA trouve zéro article.
- BEN-07 : localiser les images, exemples, contenus éditoriaux et métadonnées de partage, pas uniquement le texte du titre.
- BEN-08 : garder les listes publiques accessibles et alimentées sans connexion ; cohérence entre accueil, listes, profils organisateurs, liens directs, blog et sitemap.
- BEN-09 : vérifier les filtres de catégorie et leurs compteurs, y compris déconnecté. Sélectionner une catégorie ne doit pas faire disparaître toutes les autres. « Tous » doit avoir une signification cohérente avec le total présenté.
- BEN-10 : assurer des cartes de lieu utilisables et des liens d'itinéraire pertinents sur web, Android et iOS, avec repli en cas d'échec.

**Distinction importante :** Bénin-only concerne le marché et le catalogue. Chady a explicitement distingué le numéro du compte du numéro de paiement et n'a pas souhaité limiter automatiquement les numéros de compte au +229 si les coûts restent comparables (G 03/09 19:45-19:46). Un client étranger n'est donc pas à exclure par simple assimilation au périmètre géographique.

## 4. Comptes et inscription

### 4.1 Séparation des comptes, décision du 5 septembre

- CPT-01 : un compte client, un compte organisateur et un compte prestataire sont trois comptes distincts.
- CPT-02 : chaque compte a ses propres identifiants ; une même personne souhaitant plusieurs activités crée plusieurs comptes avec des adresses différentes.
- CPT-03 : unicité de l'adresse e-mail sur toute la plateforme, pas seulement à l'intérieur de chaque type.
- CPT-04 : interdire la transformation d'un client en organisateur ou prestataire.
- CPT-05 : interdire l'ajout d'un profil organisateur/prestataire à un compte existant.
- CPT-06 : interdire le basculement entre les trois types depuis une même connexion.
- CPT-07 : le compte client existant reste indépendant et conserve ses données lorsque la personne crée son nouveau compte professionnel.
- CPT-08 : créer un compte professionnel dédié puis compléter son dossier. L'approbation valide ce dossier ; elle ne doit pas ajouter un second type commercial à un autre compte.
- CPT-09 : conserver les permissions d'agents attribuées par mission : ventes, contrôle d'entrée, remise de remboursements. Le retrait d'une mission doit retirer ses accès.
- CPT-10 : bloquer l'inscription avec le texte exact ci-dessous lorsque l'e-mail existe déjà.

> Cette adresse e-mail est déjà associée à un compte. Veuillez utiliser une autre adresse pour créer ce compte.

**Conséquences techniques à vérifier, non décisions nouvelles :** mêmes règles côté API et interface, contrôle des créations concurrentes, normalisation cohérente des e-mails, contrôle lors d'un changement d'adresse, liens profonds et anciennes routes ne permettant pas de contourner la séparation. La migration des comptes déjà multi-profils doit être organisée sans inventer d'adresse ni déplacer silencieusement les achats/dossiers.

### 4.2 Simplification des formulaires

- INS-01 : retirer le champ SIRET/SIREN organisateur (G 03/09, capture 316).
- INS-02 : retirer également le champ devenu « IFU / RCCM / SIRET » : nouvelle demande explicite du 05/09, capture 472. Accepter `000` ou ajouter un validateur RCCM ne satisfait pas cette demande de suppression.
- INS-03 : à l'étape justificatifs montrée, ne demander que la **pièce d'identité du titulaire du compte**, et le préciser dans le libellé.
- INS-04 : retirer les documents d'entreprise et la licence de débit de boissons entourés dans la capture 319. Remplacer KBIS par RCCM/IFU n'est pas la demande.
- INS-05 : retirer le numéro SIRET/SIREN du parcours prestataire, même optionnel (capture 320).
- INS-06 : retirer l'étape « Tarifs » de l'inscription prestataire (capture 321 : devis uniquement, min/max, type de tarif). Passer EUR en FCFA ne remplace pas sa suppression. Cela ne supprime pas automatiquement le droit d'afficher ultérieurement une offre commerciale sur le profil.
- INS-07 : déplacer les modalités du mot de passe, actuellement dans le champ, vers une petite icône d'information à côté du libellé « Mot de passe » (capture 469).
- INS-08 : corriger l'icône œil sur ordinateur : dimensions, placement, absence de chevauchement et véritable affichage/masquage du mot de passe.
- INS-09 : afficher un champ de confirmation du mot de passe distinct, visible et utilisable sur ordinateur.
- INS-10 : rendre les champs et messages lisibles en saisie normale comme après remplissage automatique du navigateur ; éviter texte blanc sur fond blanc.
- INS-11 : conserver l'accès au bouton « Continuer » hors plein écran, sans dépendre d'une taille de fenêtre particulière.
- INS-12 : revoir année de naissance et genre facultatifs, également repérés par la capture 469 et R502. Leur sort exact n'est pas formulé aussi explicitement que celui du texte du mot de passe : ne pas présenter leur suppression comme définitivement ordonnée.

**Périmètre des pièces :** ces demandes concernent les formulaires LIB montrés. Elles ne prouvent pas que FedaPay renonce aux pièces qu'il peut demander pour son propre compte professionnel. Les obligations du partenaire de paiement doivent être distinguées de l'onboarding LIB.

### 4.3 Téléphone, authentification et récupération

- TEL-01 : accepter correctement les numéros béninois valides dans les trois inscriptions. La QA constate le rejet du +229 alors qu'un numéro français passe.
- TEL-02 : ne pas confondre validation de format et vérification de possession du numéro.
- TEL-03 : envisager un code OTP, de préférence WhatsApp selon Chady, en comparant les options et leur coût. Twilio est proposé pour le SMS ; un OTP e-mail ne vérifie pas la possession du téléphone.
- TEL-04 : le 4 septembre, Chady dit vouloir encore réfléchir. Le 6 septembre, il demande quel service créer et reçoit « Twilio ». Cela indique une préparation, pas la preuve du canal final, de l'intégration ni d'un contrat actif.
- TEL-05 : séparer téléphone de contact/compte et téléphone utilisé pour payer ; ne pas écraser l'un avec l'autre.
- TEL-06 : le formulaire observé permet un téléphone facultatif. Le cas du client sans compte qui doit suivre un remboursement par téléphone vérifié/SMS doit être articulé avec cette facultativité et le choix OTP.
- AUTH-01 : texte « Mot de passe oublié » précisant la condition : « Si l'adresse e-mail est reliée à un compte ». Préremplir depuis la connexion sans promettre l'existence du compte.
- AUTH-02 : messages de validation clairs en français, champ e-mail adapté au clavier mobile, gestion des liens expirés/déjà utilisés, vérification de l'adresse et changement de mot de passe.
- AUTH-03 : ne pas qualifier le gestionnaire d'identifiants local du navigateur de fuite de tous les comptes. La QA n'a pas constaté d'exposition d'autres utilisateurs.
- AUTH-04 : après connexion, garder la destination demandée quand le parcours passe par une page protégée ; déconnexion et expiration doivent réellement retirer les accès.

## 5. Rôles fonctionnels

### Client

Découvrir et rechercher les événements ; consulter les informations et disponibilités ; suivre un organisateur et marquer son intérêt ; acheter en ligne avec un compte ; retrouver billets et QR codes ; suivre annulations/remboursements ; consulter et contacter les prestataires ; participer aux conversations, groupes et playlists éligibles. Les fonctions sociales présentes dans la recette incluent demandes d'amis, acceptation/refus, blocage/déblocage, signalements et messages importants.

### Organisateur

- ORG-01 : créer/modifier ses événements, prix, catégories et quantités, période de vente, dates et lieux, description et visuels.
- ORG-02 : proposer entrées, VIP, tables/carrés, groupes, promotions, menus et options selon la configuration retenue.
- ORG-03 : gérer sa page, ses événements passés/futurs, ses abonnés et ses informations pratiques ; adresse d'établissement ou indication d'absence de lieu fixe selon le parcours décrit.
- ORG-04 : préciser conditions d'accès, âge minimum, dress code et consignes propres à l'événement.
- ORG-05 : vérifier le compte professionnel et activer le paiement requis avant publication (R58).
- ORG-06 : attribuer les missions aux agents, suivre ventes, réservations, entrées, précommandes et remboursements.
- ORG-07 : disposer de statistiques cohérentes entre toutes les vues : ventes, types de places, intérêt/réservation/présence, conversion, panier et consommations ; les analyses démographiques sont conditionnées au consentement et aux données réellement recueillies.
- ORG-08 : recevoir et traiter les demandes de remboursement sans pouvoir refuser arbitrairement celles qui respectent les règles.
- ORG-09 : accompagnement de lancement décrit dans D88 : préparation du profil, configuration, prise en main de la billetterie/du scan, assistance avant/pendant/après, analyse des résultats. Le partenaire fournit les informations et événements réels, relaie son lien et partage ses retours.

La collaboration gratuite de lancement et les bénéfices commerciaux décrits dans D88 ne sont pas des garanties de résultats. Le principe économique distingue prix facial de l'organisateur et frais LIB facturés séparément.

### Prestataire

- PRE-01 : annuaire de photographes, vidéastes, DJ/artistes, traiteurs, décorateurs, loueurs, techniciens, sécurité, accueil, transport et autres métiers de l'événementiel.
- PRE-02 : profil avec identité commerciale, spécialités, ville/mobilité dans le périmètre retenu, présentation, expérience, portfolio photo/vidéo, références, offres, matériel, disponibilité et contact.
- PRE-03 : demandes structurées possibles : date/heure, lieu, type et capacité de l'événement, service attendu, budget, contraintes techniques et livrables.
- PRE-04 : liberté d'accepter/refuser, de fixer et négocier prix et conditions ; tarif fixe, fourchette ou devis sont des possibilités du catalogue historique, pas une obligation de l'étape d'inscription supprimée.
- PRE-05 : abonnement de visibilité de 9 000 FCFA/mois ; aucune commission LIB sur le paiement des prestations, aucune exécution de prestation ou encaissement pour le compte du prestataire.
- PRE-06 : profil masqué à l'expiration selon D90, données conservées, visibilité rétablie après renouvellement. Le catalogue e-mails introduit une période de grâce non définie dans ce dossier : voir arbitrages.
- PRE-07 : les recommandations avancées, indicateurs de conversion des demandes en missions et avis annoncés comme évolutions dans D89 ne doivent pas être transformés automatiquement en engagements V1. La QA couvre néanmoins les écrans d'avis existants.

### Agents et administration

Permissions limitées à leur mission, à l'événement et/ou au point attribué ; outils de vente, scan et caisse/remboursement ; suivi des opérations ; modération des signalements et examen des dossiers pour les agents habilités. Un agent de caisse ne doit pas recevoir implicitement tous les droits d'un administrateur ou d'un autre organisateur.

## 6. Économie et paiements

### 6.1 Billetterie

Source : D90, confirmé/repris dans R58.

| Élément | Règle |
|---|---|
| Prix facial | Fixé par l'organisateur, hors frais et options |
| Frais LIB | 5 % du prix facial ; minimum 200 FCFA, maximum 1 500 FCFA **par entrée** |
| Frais techniques | Frais de paiement séparés ; pas du chiffre d'affaires LIB ; l'organisateur peut les absorber ou les faire payer au participant |
| Groupe | Prix moyen = montant facial du groupe / nombre définitif d'entrées ; appliquer plancher/plafond par entrée puis multiplier par ce nombre |
| Option annulation | 10 % du facial, plafond 5 000 FCFA, seulement si facial au moins 5 000 FCFA |
| Abonnement prestataire | 9 000 FCFA/mois |

Exemples groupe du dossier : 120 000 FCFA pour 8 entrées donne 6 000 FCFA de frais LIB ; 200 000 pour 10 donne 10 000 ; 500 000 pour 10 donne 15 000. Ne pas appliquer un plafond unique de 1 500 FCFA à toute la commande de groupe.

Le nombre définitif d'admissions doit être verrouillé ; une capacité variable ne doit pas permettre de sous-déclarer les entrées pour réduire les frais. D90 évoque aussi une éventuelle absorption des frais LIB par l'organisateur : option à distinguer de la règle confirmée sur les frais techniques.

### 6.2 FedaPay

- PAY-01 : utiliser FedaPay Marketplace pour répartir la transaction entre organisateur, LIB et frais techniques selon les lignes financières.
- PAY-02 : proposer seulement les moyens effectivement actifs sur FedaPay au Bénin. La mention des opérateurs dans un dossier n'est pas une preuve de leur activation réelle.
- PAY-03 : ne pas présenter Stripe Connect, EUR ou un rail « hors lancement » comme parcours opérationnel de la V1 Bénin.
- PAY-04 : aucun stockage d'un solde monétaire client dans LIB ; pas de financement du remboursement avec un portefeuille LIB.
- PAY-05 : générer/valider le billet sur confirmation fiable du paiement ; gérer échec, annulation, retour WebView, fermeture d'application, double clic et notification de paiement répétée sans double commande ni double débit.
- PAY-06 : afficher une erreur compréhensible et exploitable lorsqu'un compte de paiement ou un événement est mal configuré, plutôt qu'un simple « réessaie » indéfini.
- PAY-07 : la QA a atteint l'API mais pas la page de paiement, avec HTTP 409. La répartition instantanée affichée dans le texte n'a donc pas été prouvée par une transaction complète dans cette recette.

### 6.3 Boosts de visibilité, spécification D90 non explicitement abandonnée

Emplacements Top 1, Top 2, Top 3, **par ville**, durée de 1 à 7 jours ; un événement par emplacement et date ; réservation payée avant activation ; pas de renouvellement automatique ; pas de plusieurs rangs simultanés pour le même événement ; maximum 7 jours consécutifs puis nouvelle réservation si disponibilité ; alternatives proposées si créneau occupé. L'exclusion historique des événements privés reste sans objet si ces événements sont hors V1.

| Jours | Top 1 (FCFA) | Top 2 (FCFA) | Top 3 (FCFA) |
|---|---:|---:|---:|
| 1 | 5 000 | 3 500 | 2 500 |
| 2 | 9 000 | 6 500 | 4 500 |
| 3 | 13 000 | 9 500 | 6 500 |
| 4 | 17 000 | 12 500 | 8 500 |
| 5 | 21 500 | 15 000 | 10 000 |
| 6 | 26 000 | 17 500 | 11 500 |
| 7 | 30 000 | 20 000 | 12 500 |

## 7. Billets, réservation, consommations et playlist

- BIL-01 : achat en ligne réservé à un compte client ; achat auprès d'un agent possible sans création de compte.
- BIL-02 : billet et QR code à présenter à l'entrée ; contrôle de validité, refus d'un QR inconnu/invalide/déjà consommé ; contrôle des droits du scanner.
- BIL-03 : stock partagé entre vente web, mobile et agents, avec protection contre les achats concurrents et le dépassement des capacités.
- BIL-04 : billets de groupe, tables et carrés ; nombre d'admissions définitif, plusieurs billets rattachés à l'acheteur principal.
- BIL-05 : D87 prévoit distribution des billets aux invités, transfert non révocable une fois envoyé et absence de remise pour places inutilisées. **Le partage/distribution n'est pas une revente payante** ; préciser le périmètre final du transfert nominatif, qui n'a pas été validé séparément dans la dernière synthèse.
- BIL-06 : remboursement du groupe entier rattaché au payeur principal, sans répartition d'argent par LIB entre invités.
- BIL-07 : conserver la période de précommande/prévente, le blocage temporaire de place et de prix et l'option d'annulation (G 05/09).
- BIL-08 : MOB prévoit des blocages de 24 h et 72 h avec acompte, activation, paiement du solde et libération du stock à expiration. Les tarifs, montants d'acompte, règles de prolongation et articulation exacte entre prévente et blocage ne sont pas arrêtés par les derniers messages.
- BIL-09 : R58 retient les événements payants, pas d'événement entièrement gratuit ; les guestlists restent une fonction complémentaire. Les anciens tests d'achat gratuit ne sont pas la référence V1.
- CONSO-01 : précommander boissons/repas **en même temps que le billet**, puis retrait sur place. Ne pas déduire de vieux boutons « Commander » que les commandes postérieures ou autonomes sont exigées en V1.
- CONSO-02 : menus, packs, disponibilité, stocks, anticipation/préparation et suivi de remise des consommations ; distinguer servi, annulé et remboursé dans les chiffres.
- MUS-01 : playlist participative liée à l'événement ; proposition de morceaux et « j'aime » des participants ; classement consultable par le DJ.
- MUS-02 : DJ habilité à consulter et modérer, sans obligation de jouer chaque morceau ; D88 prévoit catégories de billets éligibles, échéance de participation, limites de vote, actualisation et export.
- SOC-01 : messagerie et groupes pour organiser les sorties et partager des événements ; droits des membres, fiabilité des messages, états vides, modération et blocage.
- SOC-02 : sur mobile, un texte ordinaire doit être affiché comme texte et non « message non supporté ». Un format réellement non pris en charge doit avoir un repli compréhensible.

## 8. Vente par agents et hors application

Source détaillée : D87, à relire avec le modèle financier plus récent R58.

### Fonctionnement commun

- AGT-01 : l'organisateur désigne et rémunère ses agents ; LIB ne les rémunère pas à sa place.
- AGT-02 : l'agent vend uniquement les événements/types de billets autorisés, avec quantités, options et précommandes applicables.
- AGT-03 : pour un client existant, recherche par e-mail/téléphone, vérification par code et rattachement du billet ; **ne jamais demander son mot de passe**.
- AGT-04 : pour un client sans compte, parcours invité simplifié, contact permettant la transmission/recherche du billet et invitation facultative à télécharger l'application ; pas de compte avec mot de passe imposé.
- AGT-05 : téléphone du payeur Mobile Money distinct du contact destinataire du billet si nécessaire ; confirmation du paiement avant validation du billet dans le parcours numérique.
- AGT-06 : même prix et mêmes frais LIB à situation équivalente, pas un prix caché différent parce que la vente passe par un agent.
- AGT-07 : suivi des ventes par événement/type, agent, montant, cash/numérique, avec/sans compte et consommations ; ne pas mélanger encaissement, somme due et règlement effectif.
- AGT-08 : D87 réserve les informations nominatives de l'acheteur à l'agent concerné et à LIB, avec statistiques agrégées pour l'organisateur dans ce contexte. À articuler avec les identités nécessaires au remboursement, sans ouvrir tout le fichier clients.
- AGT-09 : vente distante par échange avec un agent possible ; même logique de stock et confirmation.

### Vente rapide à l'entrée

Une place par opération, billet immédiatement contrôlé/consommé, sans précommande ; principalement espèces. Utiliser le parcours standard pour les cas Mobile Money plus complets. Prévoir le reçu/contact et prévenir l'utilisateur de l'effet immédiat du scan.

### Deux mécanismes cash présentés, pas une décision unique

| Variante D87 | Mécanisme décrit | Point restant à régler |
|---|---|---|
| 1 : vente à l'entrée | Récupérer immédiatement la part LIB sur le moyen de paiement/réserve de l'organisateur. En cas d'échec, billet délivré au client ayant payé, dette et alerte côté professionnel. | Seuils de blocage, réserve et régularisation ; mention historique de déduction future à concilier avec l'absence de versement différé. |
| 2 : vente en point de vente | L'agent reverse numériquement le montant intégral, réparti LIB/organisateur, avant émission du billet. Échec : règlement en attente, finaliser ou rendre les espèces. | Le texte final du dossier dit aussi ne pas bloquer le billet d'un client ayant payé : contradiction à lever selon le parcours. |

Le journal attendu comprend agent, événement, type de billet, date, somme reçue, parts LIB/organisateur, état du règlement, canal/date de régularisation, alertes et suspensions. Les chiffres du modèle d'e-mail (« seuil 5 », « 3 jours ») sont des exemples, pas des seuils contractuellement confirmés.

## 9. Annulation, report et remboursements

**Référence : R58, version 1.1 du 31 août.** Elle remplace les règles antérieures contradictoires de D91, D93 et des anciens e-mails. Il s'agit d'exigences produit fournies par le projet, pas d'une validation juridique locale.

### 9.1 Responsabilités et montants

- REM-01 : organisateur vendeur du billet et responsable de la trésorerie nécessaire ; sa part est reçue immédiatement, sans réserve automatique jusqu'après l'événement.
- REM-02 : LIB calcule les droits et montants, invalide les billets, crée les dossiers, notifie, conserve les preuves et facilite le suivi/les contestations.
- REM-03 : aucun remboursement exécuté via FedaPay ; remboursement financé et effectué par l'organisateur ou ses agents, suivi dans LIB.
- REM-04 : remboursement du groupe en totalité au payeur principal ; redistribution aux invités hors LIB.
- REM-05 : l'organisateur supporte les éventuels frais d'envoi pour que le destinataire reçoive le montant affiché intégralement.

| Situation | Montant à rembourser | Parcours |
|---|---|---|
| Option d'annulation valablement utilisée | Prix facial uniquement ; ni frais LIB, ni frais techniques, ni prix de l'option | Individuel, toujours |
| Événement annulé | Facial + équivalent des frais LIB + options achetées avec la place, dont option annulation/blocage de prix ; frais techniques seulement s'ils sont récupérables | Point de remboursement par défaut ; bascule individuelle possible |
| Report refusé dans les 24 h | Même règle que l'événement annulé | Même parcours que l'annulation |
| Report accepté ou sans demande dans le délai | Pas de remboursement ; billet conservé pour la nouvelle date | Aucun paiement de remboursement |

LIB conserve ses frais déjà perçus : c'est l'organisateur qui rembourse au participant leur équivalent lors d'une annulation/report remboursé. Exemple R58 : billet 10 000, frais LIB 500, frais techniques 200, option 1 000. Option utilisée : 10 000 remboursés. Annulation/report refusé : 11 500, hors les 200 techniques s'ils ne sont pas récupérables.

### 9.2 Option d'annulation volontaire

- REM-06 : activation par catégorie de billets par l'organisateur ; prix 10 % du facial plafonné à 5 000 ; facial minimum 5 000.
- REM-07 : achat uniquement avec le billet, en ligne ou espèces ; impossible de l'ajouter ensuite.
- REM-08 : achat ET utilisation autorisés seulement s'il reste **strictement plus de 48 heures avant la fermeture de la billetterie**, pas avant le début de l'événement.
- REM-09 : à l'instant exact « fermeture - 48 h », achat et utilisation ferment simultanément.
- REM-10 : vérifier billet payé, option payée, billet valide/non scanné/non déjà annulé ou remboursé, délai et absence de demande antérieure.
- REM-11 : récapitulatif avant confirmation, montant calculé serveur, avertissement d'irréversibilité ; invalidation du billet/QR et création de demande dans une même opération.
- REM-12 : **ne pas remettre la place en vente avant validation du remboursement par l'organisateur**.
- REM-13 : demande valide non refusable discrétionnairement ; remboursement individuel obligatoire, suivi et possibilité de signaler la non-réception.

### 9.3 Annulation de l'événement

- REM-14 : avertir l'organisateur du nombre de commandes, du montant global et de sa responsabilité ; double confirmation.
- REM-15 : action irréversible dans son interface standard ; arrêt immédiat des ventes et invalidation des billets concernés.
- REM-16 : créer automatiquement un dossier par commande payée, y compris espèces, par traitement reprenable et idempotent ; aucune action initiale demandée au participant.
- REM-17 : envoyer montant, code unique et point de remboursement attribué, **quel que soit le moyen de paiement d'origine**.
- REM-18 : bouton « Je ne peux pas me déplacer » ; avertir puis demander confirmation définitive. Désactiver le code, retirer le dossier de la file de l'agent et le basculer vers le remboursement individuel organisateur. Aucun retrait cash parallèle ensuite.

### 9.4 Report

- REM-19 : exiger nouvelle date et nouvelle heure. Sans nouvelle date, ne pas notifier un report définitif comme si elle était fixée.
- REM-20 : billet automatiquement conservé pour la nouvelle date ; informer de la date et de l'heure exacte de fin du droit à remboursement.
- REM-21 : délai de **24 heures calendaires depuis l'émission de la notification** ; pas 24 h ouvrées, ni depuis l'ouverture de l'e-mail.
- REM-22 : refus dans le délai : confirmation irréversible, QR invalidé et dossier créé selon le parcours d'annulation.
- REM-23 : sans demande à l'échéance, billet toujours valide pour la nouvelle date et disparition du bouton de remboursement.

### 9.5 Retrait au point et agents

- REM-24 : code aléatoire, non séquentiel, sécurisé, à usage unique, associé au bon dossier et au point attribué ; tentatives limitées et échecs journalisés.
- REM-25 : toute personne présentant le code valide peut retirer ; l'acheteur est responsable de sa confidentialité/transmission. Le code n'est pas nominatif au sens d'une obligation de présence du payeur.
- REM-26 : agent autorisé uniquement pour son point ; vérification du code, affichage du montant non modifiable et de l'état, remise du montant exact.
- REM-27 : **signature numérique au doigt obligatoire avant clôture de la remise** ; code invalidé définitivement, caisse mise à jour et confirmation envoyée.
- REM-28 : validation atomique, y compris si deux agents présentent simultanément le même code. Un retrait validé ne peut être payé une seconde fois.

### 9.6 Remboursement individuel

| Achat d'origine | Destination autorisée |
|---|---|
| Mobile Money | Compte externe utilisé pour l'achat, repris automatiquement, masqué et verrouillé ; compléter seulement ce qui manque |
| Carte bancaire | Compte bancaire appartenant à l'acheteur ; RIB fourni par sa banque, titulaire vérifié, données chiffrées |
| Espèces | Compte Mobile Money ou bancaire vérifié appartenant à l'acheteur |

- REM-29 : collecter ces coordonnées seulement après l'option valablement utilisée ou la bascule « Je ne peux pas me déplacer », pas comme condition inutile à tous les retraits cash.
- REM-30 : ne pas permettre la saisie libre d'un compte tiers ; les cas exceptionnels de destination nécessitent vérification et trace.
- REM-31 : organisateur renseigne référence officielle, date, canal et preuve lisible ; état « Remboursement déclaré », puis information du participant.
- REM-32 : conserver l'original des preuves ; ajouter les corrections à l'historique sans remplacement silencieux. Preuves accessibles au client et à l'organisateur autorisés.
- REM-33 : le participant peut confirmer réception ou « Je n'ai pas reçu le remboursement » ; la déclaration de l'organisateur n'est pas automatiquement la preuve que le client a reçu les fonds.

### 9.7 Contestations et états

- REM-34 : avant contestation, afficher les informations utiles et demander le motif ; vérifier canal/numéro pour éviter les erreurs.
- REM-35 : contestation = dossier rouvert, billet toujours invalide, référence initiale conservée, aucune seconde demande ni paiement automatique en doublon.
- REM-36 : vérifier succès officiel du transfert, bon destinataire, bon montant et référence non réutilisée.
- REM-37 : transfert échoué/annulé : recommencer ; erreur de destinataire par l'organisateur : il reste responsable du bon remboursement ; bon destinataire et succès officiel : pas de second remboursement, vérification auprès de l'opérateur.
- REM-38 : une simple capture ne garantit pas la réception. L'organisateur peut traiter la contestation avec décision motivée par e-mail ; la poursuite du litige se fait avec son support, sous sa responsabilité et celle du client.
- REM-39 : états décrits : Code actif, Basculée en individuel, Remboursement individuel généré, Informations requises, À rembourser, Remboursement déclaré, Remboursée, Contestée, Échec technique ; la procédure prévoit aussi Contestation traitée.
- REM-40 : l'organisateur ne peut supprimer la demande, modifier le montant ou réactiver le QR. Toute exception administrative est tracée.

### 9.8 Données, sécurité, temps et textes

- REM-41 : conserver références événement/commande/billet/acheteur/organisateur/agent/transaction, cause, lignes financières, canal/destination masquée, états/dates, preuves, code/point/signature/caisse et historique de livraison des notifications.
- REM-42 : chiffrement des coordonnées bancaires et pièces sensibles, accès minimaux, masquage dans l'interface, durées de conservation/suppression définies dans la politique appropriée.
- REM-43 : client : ses dossiers ; organisateur : ses événements ; agent : son point. Filtres et export contrôlé par événement, statut, canal, date et agent.
- REM-44 : heure serveur et fuseau événement ; Bénin = référence Cotonou/Porto-Novo UTC+1. Stocker séparément début de l'événement et fermeture de billetterie ; afficher les échéances exactes.
- REM-45 : dossier existant même si SMS/e-mail échoue ; relance des canaux et journalisation, sans recréer une dette.
- REM-46 : vente sans compte : R58 prévoit téléphone vérifié et code transmis par SMS pour le suivi. À concilier avec le choix technique OTP non entièrement clos.
- REM-47 : délai public : « dans les meilleurs délais », pas promesse automatique de 2-5, 5-10 jours ou remboursement déjà effectué au simple changement de statut événement.
- REM-48 : aligner CGU/CGV, politique participant, conditions de l'option, mandat agents, confidentialité, procédure de litige et e-mails sur R58 ; validation juridique locale à obtenir, sans reprendre mécaniquement les anciennes formulations françaises.

## 10. Notifications et e-mails

### 10.1 Nouvelle règle de messagerie

Sources : G 04/09 16:08-16:09 et ICI.

- NOT-01 : **ne plus envoyer un e-mail à chaque message**.
- NOT-02 : pas d'e-mail de notification de message lorsque le destinataire est connecté/actif.
- NOT-03 : envoyer un rappel après une longue attente sans réponse **ou** une accumulation de messages successifs/en attente ; Chady cite « 10 » ou « 20 » à titre d'exemples.
- NOT-04 : regrouper les messages dans un rappel, plutôt que multiplier les e-mails indépendants ; éviter plusieurs rappels rapprochés pour la même attente.
- NOT-05 : vérifier avant envoi que le besoin existe encore : message non lu, absence de réponse/retour, état de présence. C'est une conséquence de l'objectif anti-spam, pas un seuil chiffré supplémentaire validé.
- NOT-06 : préciser durée d'attente, seuil définitif, délai entre rappels, portée par conversation ou destinataire et définition de « connecté ». Ces paramètres ne sont pas arrêtés par « 10 ou 20 par exemple ».
- NOT-07 : ne pas remplacer silencieusement « attente OU accumulation » par « seuil ET délai » : un seul message important oublié ne doit pas être exclu sans décision explicite.
- NOT-08 : cette limitation vise la messagerie ; ne pas supprimer les e-mails de sécurité, billets, reports et remboursements indispensables en l'étendant à tous les envois.

### 10.2 Identité et contenu des e-mails

- NOT-09 : identité LIVE IN BLACK harmonisée avec la palette rose retenue ; logo également demandé comme image de profil de l'adresse d'envoi (G 29/08).
- NOT-10 : passage demandé de l'ancienne adresse professionnelle à **contact@liveinblack.com** (P 06/09 18:13-18:25). Chady prévoit sa création ; pas de preuve de mise en service dans l'export.
- NOT-11 : localiser exemples, lieux, montants et liens ; ne plus utiliser Lomé/EUR comme contexte standard du lancement Bénin.
- NOT-12 : chaque notification doit correspondre à l'état réel de l'action et pointer vers le bon compte/parcours ; pas de « tu es remboursé » si seul le dossier vient d'être créé.
- NOT-13 : garder préférences de suivi, désabonnement aux suivis et distinction rappels d'intérêt / détenteur ayant déjà acheté (lien vers billet plutôt que nouvel achat).
- NOT-14 : la prévisualisation graphique rose du 1er septembre modernise le rendu mais ne prouve pas que les textes métier obsolètes ont été corrigés.

### 10.3 Inventaire des 58 scénarios historiques EM

La numérotation correspond à l'ordre des aperçus, après la couverture. L'existence d'un modèle ne constitue pas son approbation actuelle.

| N° | Scénario | Traitement au regard des décisions actuelles |
|---|---|---|
| 1 | Vérification de l'e-mail | Conserver, compte dédié |
| 2 | Réinitialisation mot de passe | Conserver |
| 3 | Changement d'e-mail | Conserver, unicité globale et vérification |
| 4 | Nouvelle connexion | Conserver, informations de sécurité exactes |
| 5 | Mot de passe modifié | Conserver |
| 6 | Compte supprimé | Conserver, texte cohérent avec les données effectivement supprimées/conservées |
| 7 | Suppression demandée | Conserver le suivi ; délai de 30 jours du modèle à valider, pas une règle juridique établie ici |
| 8 | Candidature reçue | Compte professionnel dédié ; promesse « moins de 24 h » à confirmer |
| 9 | Candidature approuvée | Ne doit pas ajouter un deuxième type de compte |
| 10 | Candidature refusée | Motif pertinent, exigences de pièces actualisées |
| 11 | Candidature à corriger | Idem |
| 12 | Espace activé | Activation du compte dédié, pas transformation du client |
| 13 | Contact | Redirection vers le support approprié |
| 14 | Nouvelle candidature agent | Notification à l'agent chargé de l'examen ; ne signifie pas création d'un nouveau type de compte commercial |
| 15 | Signalement agent | Destinataire habilité à la modération |
| 16 | Suppression agent | Agent chargé du traitement ; délais à aligner |
| 17 | Vente cash en attente | Dépend du mécanisme cash retenu ; exemple de délai non contractuel |
| 18 | Ventes cash bloquées | Dépend du seuil décidé, non du seul exemple du modèle |
| 19 | Signalement compte | Conserver, confidentialité de la procédure |
| 20 | Achat billet | Confirmation réelle de paiement et QR |
| 21 | Achat groupe | Quantité et distribution exactes |
| 22 | Paiement échoué | Aucune place promise avant confirmation |
| 23 | Place bientôt expirée | Délai réel du blocage |
| 24 | Place libérée | Libération effective du stock |
| 25 | Versement initié | Revoir/supprimer l'annonce d'un versement différé et de 2-3 jours |
| 26 | Versement confirmé | Seulement sur événement financier effectivement confirmé, pas ancien batch J+5 |
| 27 | Échec du versement | À adapter au vrai fonctionnement Marketplace |
| 28 | Annulation remboursée | Réécrire : dossier/code/point, pas remboursement automatique déjà fait ni 5-10 jours |
| 29 | Report avec remboursement | Nouvelle date, maintien du billet, limite exacte de 24 h |
| 30 | Remboursement confirmé | État réel et preuve ; supprimer ancienne promesse automatique 5-10 jours |
| 31 | Remboursement en erreur | Dossier ouvert, organisateur responsable, billet toujours invalide |
| 32 | Billet transféré | Le modèle dit « vendu » : branche de revente à désactiver ; ne pas confondre avec distribution de groupe |
| 33 | Revente créée | Désactiver V1 |
| 34 | Revente vendue | Désactiver V1, y compris promesse de versement après événement |
| 35 | Revente expirée | Désactiver V1 |
| 36 | Événement publié | Seulement après publication réellement autorisée |
| 37 | Première vente | Compteur réel |
| 38 | Jalon de ventes | Compteur réel |
| 39 | Récap J-2 | Informations événement/équipe exactes |
| 40 | Boost actif | Réservation payée et activation effective |
| 41 | Boost en conflit | Disponibilité réelle et proposition de remplacement |
| 42 | Impact annulation | Réécrire la déduction « du prochain versement » incompatible avec le modèle retenu |
| 43 | Membre ajouté à l'équipe | Mission et accès exacts |
| 44 | Membre retiré de l'équipe | Retrait effectif des permissions |
| 45 | Nouvel avis | Avis réel, accès et modération appropriés |
| 46 | Nouvel événement suivi | Préférences et désabonnement |
| 47 | Suivi annulé | Distinguer abonné informé et acheteur à rembourser |
| 48 | Suivi reporté | Idem, dates exactes |
| 49 | Message | Remplacer l'envoi unitaire par la règle NOT-01 à NOT-07 |
| 50 | Ajout groupe | Notification distincte d'un simple message, fréquence à cadrer |
| 51 | Intéressé demain | Invitation à réserver si aucun billet |
| 52 | Intéressé demain, billet déjà acheté | Lien vers le billet, pas nouvelle sollicitation d'achat |
| 53 | Abonnement J-7 | Rappel avant expiration |
| 54 | Abonnement J-3 | Idem |
| 55 | Abonnement J-1 | Idem |
| 56 | Abonnement aujourd'hui | Date réelle d'expiration |
| 57 | Abonnement, période de grâce | Durée/existence à arbitrer face au masquage à expiration de D90 |
| 58 | Profil prestataire masqué | Masquage réel, données conservées et renouvellement |

R58 requiert en plus des notifications suffisamment précises pour option utilisée, code/point disponible, demande reçue organisateur, remboursement déclaré, retrait signé effectué et contestation. Un titre générique du catalogue ne suffit pas à couvrir ces informations.

## 11. Design et ergonomie web/mobile

- UI-01 : logo retenu le 29 août, capture 213, fusion L/B ; adapter ses couleurs, utiliser les assets du pack de marque.
- UI-02 : remplacer l'accent vert par le rose sur web, mobile, visuels et e-mails ; ne pas conserver des images générées vertes en décalage avec la palette.
- UI-03 : appliquer le logo LIB à l'icône Android, au lancement/splash et aux supports concernés, pas l'icône générique.
- UI-04 : mascotte jugée « trop jouet » le 30 août, mais conservée temporairement ; ne pas considérer cet accord provisoire comme une validation définitive.
- UI-05 : retirer les quatre illustrations décoratives de l'espace membre montrées en capture 322 ; conserver seulement les fonctions réellement dans la V1, sans points de fidélité.
- UI-06 : accueil correct en fenêtre réduite comme plein écran (captures 311/312), notamment placement des boutons d'action.
- UI-07 : formulaires longs défilables et actions accessibles ; tester l'ordinateur portable d'environ 16 pouces évoqué, mais aussi diverses tailles de fenêtre.
- UI-08 : composants de boutons cohérents, dimensions ajustées horizontalement, disposition logique et compréhensible ; pas de boutons posés arbitrairement (capture 346).
- UI-09 : barre de recherche de l'en-tête sans superposition sur ordinateur (capture 476).
- UI-10 : vérifier les contrôles organisateurs, tri « Plus populaires », case « Événement à venir » et bouton « Appliquer » (capture 471). « Faut voir si ces boutons marchent » est une demande de vérification, pas une preuve que tous sont cassés.
- UI-11 : augmenter les contrastes des erreurs, du bouton de déconnexion et des petits éléments de validation ; ne pas se limiter aux champs de saisie.
- UI-12 : corriger menus de compte coupés, liens sociaux débordants, titres/sous-titres tronqués, mauvais intitulé « organisateur » dans l'espace prestataire.
- UI-13 : supprimer le doublon de boutons connexion/inscription dans l'en-tête du formulaire et rendre les sous-titres secondaires plus lisibles.
- UI-14 : ne pas laisser le lecteur audio flottant recouvrir le total du paiement mobile ; gérer proprement ses erreurs.
- UI-15 : traduction des erreurs, pas de clés brutes `comment_too_short` ou d'entités visibles `t&apos;est` / `d&apos;attente`.
- UI-16 : retour après connexion mobile vers un accueil pertinent plutôt qu'une impression de page réglages ; après création d'événement, rafraîchir « Mes événements » sans relancement manuel.
- UI-17 : clavier, zones sûres, rotation, petits écrans, textes longs, accents, dates, focus, libellés accessibles et texte agrandi à tester.
- UI-18 : lien politique cookies lisible, bon contraste et taille suffisante.
- UI-19 : le mode clair est apprécié mais explicitement non prioritaire pour le moment (G 06/09 12:22). **Différé**, pas bloquant de lancement et pas abandonné définitivement.

## 12. Recensement des anomalies signalées

### 12.1 Bilan Bénin du 5 septembre, retest du 6 septembre

Les statuts ci-dessous sont ceux des sources, pas des résultats d'une nouvelle session de test. Les priorités de lancement proposées plus bas peuvent être plus élevées que les couleurs du rapport.

| Réf. | Problème | État documentaire / exigence correcte |
|---|---|---|
| T1 / BEN-A5 | Revente visible dans « Mes billets », formulaire actif, API de listes accessible | Signalé non conforme ; V1 doit l'interdire réellement, pas seulement cacher un bouton |
| T2 / BEN-A1 | Checkout FedaPay HTTP 409 sur deux événements avec client neuf vérifié | Parcours achat bloqué ; page FedaPay jamais atteinte |
| T3 / BEN-C3 | Numéros +229 valides rejetés, France acceptée | Bloque/altère les inscriptions locales ; trois parcours concernés par les contrôles |
| T4 | Stripe Connect encore dans l'espace organisateur | Hors périmètre Bénin, même avec mention « réservé aux anciens événements » |
| T5 / BEN-F4 | Même montant affiché en EUR sur carte et FCFA sur fiche ; événements réellement EUR ; doubles soldes | Corriger affichage et données sans confondre les deux |
| T6 / BEN-E3 | Tarifs prestataire EUR | Seul correctif explicitement retesté le 06/09 : FCFA affiché ; **la suppression de l'étape demandée reste un autre critère** |
| T7 / BEN-F2 | Blog zéro article | Les 100 articles annoncés ne sont pas publiés dans l'observation |
| T8 / BEN-F3 | Carte du lieu cassée | Signalé sur les fiches, également mobile |
| T9 | Entités HTML visibles dans l'inscription organisateur | Texte à corriger |
| T10 | Requêtes RSC événements parfois 503 | Intermittence infrastructure à investiguer, pas une conclusion sur la cause |
| T11 | Champ de récupération e-mail en type texte, préremplissage sans validation | Adapter clavier/validation ; ce n'est pas en soi une fuite d'e-mails d'autres comptes |
| T12 | Identifiants de seed refusés en production | Problème de préparation des tests ; ne pas rendre des identifiants de démonstration publics pour le contourner |
| T13 / RT-1 | Contraste de déconnexion | Lisibilité insuffisante signalée |
| T14 / RT-2 | Les autres catégories disparaissent après sélection, déconnecté, événements et prestataires | Reproduit dans QA ; navigation entre catégories dégradée ; contrôler compteurs et cache/session |
| Complément D | RCCM de test rejeté, `000` accepté | Le correctif métier prioritaire est la suppression du champ demandée, pas uniquement l'élargissement du validateur |
| BEN-F1 | Catalogue non vide mais villes de plusieurs pays et Lyon | « Non vide » est positif ; **pas conforme au Bénin-only** |
| BEN-E1 | Zones International/France/Togo/etc. marquées PASS | Ancien critère, contraire au périmètre actuel |
| BEN-D2/D3/D4 | IFU/RCCM et upload entreprise marqués PASS | Ancien critère, contraire à la suppression des pièces/champs demandée |
| BEN-D5 | Œil testé sur inscription client seulement | Ne valide pas le bug desktop du compte organisateur ni sa confirmation de mot de passe |
| Parcours KYC | Validation ajoutant le rôle prestataire à un organisateur et bascule de rôle | Ne doit plus être un PASS : contraire à la décision comptes séparés du 05/09 |

**Autres réserves du rapport :** compte supposé client déjà prestataire et empêché d'acheter ; compte organisateur également candidat prestataire et localisé au Togo ; nécessité de comptes de test propres. Aucun circuit financier complet observé. Certains PASS sur l'absence de versement différé sont limités aux écrans parcourus, pas à l'ensemble des étapes de création ni aux traitements serveur.

### 12.2 Ancienne recette web du 15 août, recopiée le 20 août

Conserver ces constats comme régressions à vérifier, pas comme état certifié du 6 septembre :

1. Listes publiques d'événements et carrousel vides alors que l'administration comporte 103 événements publiés dont 60 à venir ; liens directs et pages organisateurs fonctionnent. Sitemap annoncé passé de 103 à 43 URLs.
2. Saisie de prix d'un compte CFA en EUR, récapitulatif CFA : risque majeur d'erreur monétaire.
3. Billet simultanément « remboursement demandé », en revente et QR actif : incohérence financière et anti-fraude. La revente est désormais exclue, mais l'invalidation du QR demeure impérative.
4. Consommations annulées incluses dans le revenu ; exemple servi 10 + annulé 5 = total 15 ; texte d'explication incohérent sur l'inclusion des consommations.
5. Statistiques « 80/130 vendus » contre 6 réservations/statistiques, indicateur de presque complet faux.
6. Menu avatar débordant à gauche d'environ 45 px sur les espaces professionnels/agents.
7. Double connexion/création dans l'en-tête de connexion.
8. Tests obsolètes sur événements privés/code d'accès et ancienne page de recherche dédiée supprimés fin juillet. Cela ne supprime pas la recherche actuelle de l'en-tête.
9. Libellés secondaires petits, majuscules grasses et faible lisibilité.
10. Callback de connexion perdu depuis Aide/Notifications ; classification « Aide publique » incorrecte si page protégée.
11. Champs de liens sociaux débordants, titre d'événements annulés trop lourd/sous-titre coupé, intitulé organisateur dans la barre prestataire.
12. Écarts à arbitrer à l'époque : « C'est quoi » retiré du menu mais encore au pied de page ; prévente premium annoncée mais non implémentée ; scan autorisé à tout moment décrit comme intentionnel malgré son irréversibilité ; fidélité présente mais hors tests, désormais exclue V1.
13. Mauvais clavier e-mail, lien cookies peu lisible, « Entrée libre » associé à un prix de 25 : cohérence des intitulés et tarifs à corriger.

Le résumé annonce 95 vérifications mais les sous-totaux cités 81 + 4 + 1 ne donnent pas 95. Ne pas transformer ces chiffres en taux de réussite fiable.

### 12.3 Retour APK du 23 août, partagé le 24 août

1. Lecteur audio cachant le prix de checkout.
2. Icône Android générique.
3. Filtres région sans résultats sauf « tous », à retirer plutôt qu'étendre hors Bénin.
4. Bouton Maps ouvrant une recherche Google au lieu du parcours carte approprié.
5. EUR affiché à la place de XOF.
6. Messages texte rendus comme format non supporté.
7. `comment_too_short` non traduit.
8. Remboursement d'un billet scanné refusé avec erreur générique plutôt que motif explicite ; qualifier le cas comme option d'annulation, sans extrapoler à toute annulation d'événement.
9. Profil post-connexion donnant l'impression d'arriver dans les paramètres.
10. Liste organisateur non rafraîchie après création d'événement.

### 12.4 Recette mobile de 93 cas

Le fichier MOB couvre installation, authentification, navigation, accessibilité, événements, paiement, billets/QR, agents, social, rôles, réseau et sécurité. **Les lignes de résultat sont vides : ce classeur n'est pas une preuve de 93 tests passés.** Son tableau de bord affiche aussi zéro non-exécuté malgré l'absence de résultats, à corriger.

Tous les cas et les adaptations V1 sont repris dans l'annexe. En particulier : remplacer tests Stripe/EUR et revente par tests de non-exposition/refus ; remplacer le cumul de rôles par comptes séparés ; ne pas confondre « wallet de billets » avec portefeuille d'argent ; différer le test mode clair ; requalifier gratuité, filtres internationaux et remboursements selon R58.

## 13. Livraison, exploitation et dépendances

- OPS-01 : stabiliser web et mobile, construire une recette partagée et fournir des builds identifiables. L'objectif « web fin août » était un objectif historique, pas une échéance tenue démontrée.
- OPS-02 : centraliser documents/remarques et éviter que les exigences se perdent dans WhatsApp ; demandes de regroupement le 4 septembre, documents de synthèse transmis ensuite.
- OPS-03 : organisation GitHub appartenant au projet, dépôts web/mobile transférés, Ged avec rôle Owner et collaborateurs habilités ; vérifier droits, CI/CD, Actions, intégration Vercel et variables après transfert. Les messages annoncent ces actions, sans constituer un nouvel audit des accès.
- OPS-04 : corriger les CI qui échouent ; suivre les branches de développement et la branche Yassine, intégrer les changements avant de déclarer leur livraison. Push d'une branche, fusion et déploiement sont trois états distincts.
- OPS-05 : accès Expo/Vercel pour les personnes concernées ; build APK téléchargeable et installable sur plusieurs appareils, instructions simples et version clairement identifiée.
- OPS-06 : traiter les blocages de téléchargement/installation signalés les 5 et 6 septembre ; téléchargement via ordinateur parfois réussi, ancienne application installée identifiée comme cause possible d'un conflit. Cela ne prouve pas tous les cas résolus.
- OPS-07 : une preview web/mobile aide à montrer les écrans mais ne remplace pas le test de l'application installée.
- OPS-08 : les vidéos de démonstration du 5 septembre sont signalées comme non à jour par Chady, notamment localisation/devise. Ne pas les utiliser comme cahier des charges actuel.
- OPS-09 : préparer société béninoise et compte bancaire professionnel puis FedaPay professionnel, Apple Developer et Google Play avec les informations de la société. Chady indique une aide familiale locale pour ces démarches ; pas de preuve de finalisation dans les échanges.
- OPS-10 : accès Hostinger et domaine/e-mail ; difficultés d'accès puis connexion annoncée le 31 août ; ne pas réutiliser ni publier les secrets transmis dans les discussions.
- OPS-11 : Google Analytics et accès au tableau de bord annoncés fin août ; Search Console annoncée le 1er septembre. Préserver SEO, sitemap dynamique, RSS et aperçus de partage décrits dans AV, en les localisant au Bénin.
- OPS-12 : revue des CGU/CGV/confidentialité/remboursements et textes d'e-mails avant lancement ; responsabilités organisateur, mandat agents et conservation des données à transposer.
- OPS-13 : la recette doit tracer build, appareil/OS, environnement, compte/type, étapes, attendu/obtenu, date, testeur et preuve ; appareils iOS/Android compacts et récents, réseau faible/hors ligne, accessibilité.
- OPS-14 : critère de sortie MOB : tous les P0/P1 applicables passés, aucun crash ni problème ouvert de sécurité/paiement, exceptions documentées. Mettre d'abord le plan en accord avec la V1 pour éviter de bloquer sur des fonctionnalités volontairement retirées.

### Portée du rapport d'avancement AV

AV annonce environ 53 séries de modifications (50 web, 3 mobile) et plus de 1 000 fichiers touchés. Il couvre harmonisation UI/tableaux de bord, notifications in-app/e-mail/push, messagerie, tickets/paiements/scan, espaces métiers, SEO/sitemap/RSS, import de blog, e-mails, refonte mobile/assets/splash, validation des formulaires, modales, tests, déploiement et documentation.

Ces éléments sont **des travaux déclarés pour le 12-26 août**, pas des demandes nouvelles ni des preuves d'absence de bugs. Les parties revente et modèle multi-rôles du bilan sont désormais obsolètes. Le volume de fichiers/commits ne mesure pas la conformité métier.

## 14. Décisions anciennes à conserver sans les réactiver

### 14.1 Revente, D92 : intégralement exclue de la V1

Ancien périmètre : propriétaire authentifié d'un billet LIB payé, valide, non scanné/non remboursé ; prix positif au plus égal au facial ; commission de 5 % avec minimum 200 et maximum 1 500 par entrée, déduite du vendeur, frais techniques acheteur ; pas de nouveau paiement de l'organisateur ni double commission d'achat.

Anciennes fonctions : mise en vente/retrait/expiration, QR désactivé à la mise en vente et nouveau QR plutôt que réactivation de l'ancien, réservation atomique, nouvel identifiant pour l'acheteur ; groupe indivisible si tous les billets encore détenus ; vendeur anonyme ; aucune négociation ou paiement extérieur ; notifications et reçus ; file d'attente FIFO compatible avec catégorie/quantité et créneau réservé de 10 minutes ; une réservation active ; arrêt 2 h avant portes ; paiement vendeur après événement dans un délai indicatif de 2-5 jours ouvrés.

Anciennes protections : confirmation sensible par mot de passe/PIN/biométrie et OTP selon risque, destination de versement vérifiée, QR aléatoire sans données personnelles, statuts serveur et journaux de scans/appareils/portes, prévention double scan, cache hors ligne/synchronisation, QR dynamique comme niveau renforcé ; surveillance auto-achat, téléphones/paiements/appareils communs, cycles rapides, comptes récents, changement de coordonnées, litiges et échecs, plafonds de reventes proposés, suspension par administration ; statistiques organisateur sans exposer les vendeurs ; gels lors d'annulation/report selon l'ancienne politique.

**Conclusion actuelle :** aucun de ces détails ne justifie de laisser une API, un bouton, un e-mail ou un job de revente actif en V1. Le document reste historique pour une éventuelle décision future.

### 14.2 Avance de 50 % et versement final, D93 : exclus

Ancien modèle : une avance maximum par événement, au plus 50 % du net éligible déjà encaissé numériquement ; pas de prêt LIB ; exclusion espèces, fonds contestés/remboursables, frais, fonds d'autres événements et produits de revente ; protection intégrale des billets couverts par option tant que leur droit court, et du prix de l'option.

Ancien parcours : demande chiffrée avec détail, destination vérifiée et consentements ; organisateur certifié automatique si tous critères, non certifié avec justificatif de dépense et décision administrative motivée ; plafonds non contournables ; refus si événement annulé/suspendu/commencé/clos, incident, insuffisance, dette, avance déjà prise ou fraude ; états brouillon/en attente/acceptée/refusée/en paiement/payée/à régulariser/soldée ; déduction du solde du même événement, pas d'utilisation des fonds d'un autre ; organisateur reconstituant les fonds nécessaires aux remboursements ; audit et textes contractuels versionnés.

**Conclusion actuelle :** la part organisateur est répartie immédiatement à chaque achat. Avance, réserve jusqu'après événement et calendrier J+5 ne s'appliquent plus. Les anciennes formulations juridiques françaises ne sont pas validées pour le Bénin par cette synthèse.

### 14.3 Ancienne politique D91 : remplacée par R58

Ne plus appliquer : remboursement automatique carte par le prestataire/équipe LIB pour Mobile Money ; délai fixe 2-5 jours ; organisateur ne recevant rien avant l'événement ; frais LIB non remboursés au client même lors de l'annulation de l'événement ; remboursement/report sans la nouvelle fenêtre précise ; recours à la revente en cas de changement d'avis.

Points historiquement utiles mais à relire avec R58 : arrêt des ventes/QR invalides lors d'annulation ; groupe remboursé au payeur ; consommations précommandées remboursées dans l'ancienne politique ; traitement d'une modification majeure comme report. Le traitement précis des consommations et des modifications majeures doit être explicitement aligné avec la nouvelle politique, qui ne les détaille pas au même niveau.

### 14.4 Autres retraits et reports

- International/France et multi-devises : hors lancement, pas suppression définitive imposée de toute capacité future.
- Fonctionnalités masquées pour une réactivation ultérieure : approche proposée le 21 août ; les fonctions exclues doivent néanmoins être réellement inaccessibles en V1.
- Cumul de profils et commutateur client/organisateur/prestataire : décision expressément remplacée le 5 septembre.
- Fidélité/points et portefeuille d'argent : exclus par la présentation du 5 septembre.
- Événements privés/code d'accès et ancienne recherche dédiée : retirés historiquement ; ne pas réintroduire via un ancien plan QA.
- Événements entièrement gratuits : exclus dans R58 ; guestlists complémentaires conservées.
- Mode clair : différé le 6 septembre, non prioritaire.
- Mascotte : conservation temporaire malgré réserve graphique.
- Troktrok et ses captures dans la conversation privée : autre projet personnel de Chady, **hors périmètre LIB**.

## 15. Contradictions et précisions restant à résoudre

| Sujet | Ce qui est établi | Ce qui reste ouvert / erreur à éviter |
|---|---|---|
| Documents organisateur | Pièce du titulaire seulement sur le formulaire montré | R384 et QA demandent encore RCCM/IFU entreprise : retranscription non conforme, pas nouveau consentement de Chady |
| Identifiant entreprise | Suppression du champ organisateur et prestataire demandée | Ne pas déclarer clos parce que `000` ou RCCM est accepté |
| Tarifs inscription prestataire | Étape à retirer | QA ne vérifie que FCFA et devis ; distinguer la présentation ultérieure du catalogue |
| Bénin-only | Catalogue et interface adaptés au Bénin | Pays étrangers « ouest-africains » ne satisfont pas la demande ; règles précises de mobilité interne à conserver sans menu international |
| Téléphones | Numéro compte distinct du payeur ; ouverture à des numéros étrangers envisagée | Canal OTP, budget, obligation, moment de vérification ; audio du 03/09 non transcrit |
| Notifications messages | Pas par message, pas si connecté ; attente ou accumulation | 10/20, délai, anti-répétition, unité de regroupement et définition de présence non définitivement fixés |
| Comptes historiques | Interdiction du cumul désormais explicite | Traitement des comptes déjà mixtes et conservation de leurs données ; aucune migration silencieuse autorisée |
| Démographie | Année/genre facultatifs repérés dans la capture | Demande précise de retrait pas aussi explicite ; impacts sur statistiques marketing historiques |
| Cash agents | Vente avec/sans compte maintenue | Choix ou coexistence des deux variantes D87, émission en cas d'échec, réserve, seuils, recouvrement sans J+5 |
| Abonnement | 9 000/mois, masquage si non renouvelé | Masquage immédiat à expiration ou période de grâce des e-mails ; durée non précisée |
| Blocage de place/prix | Fonction maintenue | Durées 24/72 h présentes dans QA, tarif, acompte, calcul de frais/remboursement et configuration finale à confirmer |
| Groupes/transferts | Groupe maintenu, remboursement au payeur | Distribution non payante vs transfert nominatif ; ne pas réintroduire de revente |
| Consommations | Achat avec billet et remise sur place | Montant/restock lors d'annulation/option/report, et sort des anciens achats après billet |
| Modification majeure | Ancienne politique assimilait certains changements à un report | Définition et déclenchement final à confirmer dans la politique actualisée |
| Scan | Refus du double scan, QR remboursé invalide | Ancien scan « à tout moment » intentional ; fenêtre finale et exceptions à cadrer sans en inventer une |
| Prestataires avancés | Annuaire, contact direct et abonnement confirmés | Priorité V1 des avis/recommandations/analyses avancées présentés comme possibilités |
| Boosts | Barème D90 disponible et non expressément retiré | Validation opérationnelle de leur mise en service et du comportement de remboursement en cas de conflit |
| E-mails | 58 modèles + aperçu rose | Promesses 24 h/30 jours/période de grâce/délais financiers à aligner ; modèles anciens ne sont pas contrats validés |
| Livraison | Plusieurs corrections annoncées et branches poussées | Preuve build/merge/déploiement/recette métier manque ; ne pas confondre état local et production |

## 16. Ordre de traitement recommandé

Cette priorisation est une recommandation de synthèse, pas une nouvelle décision prise à la place du client.

1. **Bloquer les incohérences d'argent et de droits** : paiement FedaPay complet, montants XOF exacts, comptes séparés, revente désactivée réellement, permissions et invalidation atomique des billets/remboursements.
2. **Conformer les parcours d'inscription aux demandes exactes** : retirer les champs/pièces/étape indiqués, accepter les numéros béninois, corriger mot de passe/confirmation et accessibilité des actions.
3. **Conformer remboursements et ventes agents** : règles R58, signature/code unique, contestations, preuve et arbitrages cash avant exploitation réelle.
4. **Nettoyer le périmètre Bénin et les communications** : données, filtres, devises, Stripe, exemples/e-mails, contact professionnel et rappels de messagerie non répétitifs.
5. **Réparer découverte et ergonomie** : catégories, cartes, blog, statistiques, responsive, contrastes, boutons et régressions mobiles.
6. **Mettre à jour la recette puis valider la release réelle** : comptes propres, paiement de bout en bout, agents/QR/remboursement, builds Android/iOS, réseau faible, résultats et preuves par cas.

## 17. Résumé opérationnel

La V1 demandée est une marketplace événementielle **Bénin, FCFA, FedaPay**, sur web/iOS/Android, avec **trois comptes indépendants**, une billetterie et des outils agents, un annuaire prestataires à **9 000 FCFA/mois**, et des remboursements **financés par l'organisateur** selon R58. Elle exclut revente, portefeuille d'argent, fidélité, avances et versement J+5. Les inscriptions doivent être réellement simplifiées, les e-mails de messagerie regroupés et conditionnels, et les anciens contenus/règles doivent être retirés de toutes les surfaces concernées.

La principale source de dérive repérée est la validation de corrections contre **un ancien cahier de tests plutôt que les décisions récentes de Chady**. Les points « adaptés Bénin » ne sont pas nécessairement conformes quand la demande était « supprimer ». Cette synthèse doit être lue avec ses arbitrages et ses limites médias, sans revendiquer une exhaustivité des vocaux non transcrits.
