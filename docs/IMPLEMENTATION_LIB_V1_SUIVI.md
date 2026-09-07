# Suivi d'implementation V1

## Objectif integral

Implementer toutes les exigences actuelles de `SYNTHESE_EXIGENCES_LIB_2026-09-06.md`, y compris web, mobile, recettes et verification du deploiement. Ne pas reactiver les decisions historiques exclues. Ce chantier n'est pas termine.

Le registre `implementation-lib-v1.json` reprend 196 exigences identifiees, les familles complementaires (58 e-mails, 93 tests mobiles, QA, economie) et les dependances externes. Un statut local ne vaut pas validation de production.

## Lot 1 : inscriptions web, 6 septembre 2026

- Suppression du champ entreprise organisateur/prestataire et de sa validation bloquante. Le contrat API organisateur ne demande plus de SIRET/IFU/RCCM.
- L'organisateur ne voit plus que la piece d'identite du titulaire ; retrait des demandes de document entreprise et licence de boissons. Les dossiers historiques ne sont pas effaces.
- Suppression des champs tarifaires et de l'etape distincte Details prestataire : les details metier sont conserves dans Activites ; cinq etapes restantes.
- Aide mot de passe commune par icone sur les trois inscriptions ; deux champs distincts pour organisateur, controle afficher/masquer dimensionne et accessible.
- Tests de validation, contrats HTTP et parcours navigateur ajoutes.

### Preuves executees

- `npm run test:unit` : 602 tests reussis, 121 fichiers.
- Tests cibles validation/API : 13 reussis ; Cloudinary et creation effective de compte ne sont pas couverts par les mocks de contrat API.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test e2e/benin-signup-requirements.spec.ts` : 5 reussis. Organisateur en 1440x900, 1024x640 et 390x844 ; oeil/aide/confirmation/bouton accessibles ; parcours jusqu'au seul justificatif ; parcours prestataire sans tarifs jusqu'a Finaliser.
- `npx tsc --noEmit` : reussi.
- ESLint sur les fichiers concernes : 0 erreur, 1 avertissement preexistant `PHONE_RE` inutilise dans AuthForm.
- `git diff --check` : reussi.
- `npm run build` : reussi, 185 pages statiques generees. Construction avec URI MongoDB de test explicite et envois/paiements desactives ; aucune mise en production.

Les deux echecs intermediaires E2E venaient de selecteurs de texte ambigus ; les selecteurs ont ete precisés et la suite entiere relancee avec succes.

## Lot 2 : protection des comptes et changements d'adresse

- La confirmation d'adresse identifie le titulaire par son jeton, et non par le premier compte ayant cette adresse en attente.
- Mise a jour conditionnelle et traitement du conflit d'unicite : deux confirmations concurrentes ne peuvent pas attribuer la meme adresse a deux comptes. Une ancienne confirmation ne remplace pas une demande plus recente.
- Consultation, brouillon, soumission et moderation des candidatures exigent un seul type commercial correspondant au dossier. Les permissions agent restent compatibles. Aucun compte historique n'est migre ou efface silencieusement.
- Le lanceur d'integration impose MONGODB_TEST_URI au processus enfant, meme si MONGODB_URI existe deja ; le controle porte sur le nom de la base.
- Preuves locales : 43 tests d'integration reussis dans profile.integration.test.ts et applicationsAgent.integration.test.ts, base MongoDB isolee ; TypeScript, ESLint cible et git diff --check reussis.
- Suite unitaire relancee apres ces corrections : 602 tests reussis, 121 fichiers.
- Limites : ces tests ne certifient pas encore toutes les routes de creation, tous les acces de session, la migration historique, le mobile ni la production. Les controles de soumission sont renforces mais leurs parcours complets upload/inscription restent a recetter.

## Lot 3 : rappels de messagerie

- Suppression de l'e-mail unitaire ; rappel planifie durablement pour attente OU accumulation. Valeurs techniques par defaut : 30 minutes, 10 messages, cooldown de 60 minutes par conversation/destinataire.
- Presence web globale, arretee en arriere-plan ; relecture des droits, blocages, lectures et reponses avant envoi.
- Baux de traitement, curseur de lot, requete fournisseur stable en reprise, pas de succes fictif sur echec, supervision des resultats incertains.
- 113 tests d'integration messagerie/sondages/rappels passes ; suite finale de 606 tests unitaires passes (122 fichiers), dont les trois tests de route cron. Deux tests navigateur de presence passent.
- Build de production reussi (186 pages statiques), TypeScript, ESLint cible et git diff --check reussis. Le nouveau modele est ajoute aux registres d'initialisation des index.
- Details d'exploitation et limites explicites dans `MESSAGERIE_RAPPELS_V1.md`. Aucun deploiement ni e-mail reel effectue.

## Lot 4 : frais par admission et regressions de connexion

- Correction des frais XOF pour les groupes/tables : prix moyen par admission, arrondi des frais a l'entier par admission, plancher/plafond appliques a chaque entree puis multiplication. Exemples D90 : 120000/8 -> 6000 ; 200000/10 -> 10000 ; 500000/10 -> 15000 FCFA.
- Meme calcul dans les commandes web, ventes agents et apercus web. Le total de confirmation agent inclut maintenant les frais LIB et distingue facial/frais.
- Refus d'une place de groupe presentee comme billet individuel. Admissions prises depuis la configuration serveur et conservees dans la commande ; refus si prix/type/capacite changent entre lecture et transaction.
- Interface : nombre definitif d'entrees incluses, plus de case agent permettant de sous-declarer un groupe ; configuration invalide bloquee avec explication.
- Recette : 25 tests de frais, 6 tests d'integration transactionnelle sur base isolee et suite unitaire complete de 618 tests reussis (123 fichiers). TypeScript et ESLint cibles reussis.
- Trois tests navigateur finaux reussis sur le port 3017 : recapitulatif client, premier rendu du Studio puis confirmation agent, conservation du refus CSRF. Aucun achat confirme dans le navigateur.
- Build de production reussi : compilation, verification TypeScript et generation des 186 pages statiques. URI de base de test imposee, cles d'envoi/paiement desactivees ; aucune transaction externe ni mise en production.
- Le navigateur a revele une course CSRF au premier login : les lectures de session/providers et le proxy de pages ne reemettent plus ce cookie ; /csrf et les POST conservent leur protection. Test navigateur explicite du refus d'un faux jeton. Aucun cookie de session n'est retire par le correctif.
- Le premier rendu du Studio organisateur invalidait un tag de cache pendant le rendu. Cette invalidation est maintenant differee avec after ; les appels API conservent leur invalidation normale.
- Les premiers echecs E2E comprenaient des fixtures incompletes, la course CSRF ci-dessus et un conflit de port : un service Docker utilisateur a pris 3001. Utiliser desormais PLAYWRIGHT_PORT=3017 pour cette recette apres verification que le port est libre. Aucun service utilisateur n'a ete arrete.
- Les anciennes suites orders.integration.test.ts/agentSales.integration.test.ts contiennent encore des attentes EUR/Stripe obsoletes ; les nouveaux tests XOF ne doivent pas etre presentes comme leur remplacement exhaustif.
- Aucune commande historique repricee, aucun paiement reel, aucun deploiement.

## Lot 5 : eligibilite de l'option a l'achat

- L'API refuse explicitement une option demandee mais indisponible (devise, activation, frais nuls sous le seuil ou echeance). Elle ne transforme plus silencieusement cet achat en commande sans option et ne peut plus enregistrer une option achetee gratuitement.
- Activation et echeance sont relues dans la transaction avant toute reservation de stock. Une desactivation ou une fermeture du droit pendant le traitement annule la commande sans consommer de stock.
- Message explicatif francais dans le checkout. Aucun changement des commandes historiques.
- Preuves : 11 tests d'integration groupes/options reussis sur MongoDB isole (dont 5 nouveaux : 4999, 5000, plafond 60000, desactivation concurrente, echeance concurrente), TypeScript et ESLint cibles reussis. Pas de nouvelle recette navigateur ni de nouveau build pour ce lot.
- Limites : paiement effectif de l'option, utilisation, priorite report/annulation et notifications de remboursement restent a auditer et corriger. Le calcul facial groupe/quantite existant reste inchange.

## Lot 6 : demande de remboursement et atomicite

- Decision partagee relue dans la transaction : commande payee, absence de demande precedente, annulation automatique prioritaire, refus de report dans les 24 h prioritaire sur l'option. Apres cette fenetre, une option encore valide reste utilisable ; aucun nouveau droit n'est invente.
- Une option marquee achetee avec frais nuls ne suffit plus. Verification stricte de l'echeance de fermeture moins 48 h.
- Creation du dossier avant invalidation des billets et marquage de la commande dans la meme transaction : sans point de retrait, aucun billet invalide ni marqueur de demande ne subsiste. Deux demandes simultanees produisent un seul dossier.
- Reponse des deux API : requested=true, refunded=false et refundCaseId. La notification de demande annonce le montant a rembourser, jamais un versement deja effectue ; elle inclut code/point/adresse lorsque disponibles, sans code complet dans le push.
- Preuves : 18 tests d'integration sur base MongoDB isolee et 5 tests unitaires cibles reussis ; ESLint et git diff --check reussis. Les identifiants buyer-1 invalides des anciennes fixtures ont ete remplaces par un identifiant MongoDB valide, sans assouplir le code applicatif.
- Limites : aucune recette navigateur/deploiement. Restent notamment les notifications durables en cas d'echec, les liens de suivi sans compte, la coordination avec une annulation concurrente de l'evenement, les autres notifications de declaration/reception et les destinations de paiement. Le refus actuel des billets scannes lors d'un report reste a aligner explicitement avec R58.

## Lot 7 : chiffrement des donnees sensibles

- Separation du chiffrement des textes sensibles et de la normalisation des codes de retrait. Les nouveaux textes gardent espaces, casse et accents ; aucun texte historique n'est modifie.
- Suppression du secret public de secours : echec de chiffrement sans secret configure. Format historique conserve pour les donnees protegees avec la meme cle configuree ; rejet des enveloppes comportant des segments supplementaires.
- 8 tests unitaires cibles passes : textes exacts, alea, alteration, mauvaise cle, absence de secret, lecture du format historique et regles de remboursement existantes.
- Procedure et reserves avant deploiement dans REMBOURSEMENTS_CHIFFREMENT_V1.md. Aucune rotation ni migration de production ; l'ancien repli public n'est volontairement pas reutilise par le runtime.

## Lot 8 : declaration et reception distinctes

- L'e-mail de declaration annonce l'action de l'organisateur, la reference et le canal, et demande de verifier les fonds/la preuve. Il ne promet plus un remboursement confirme ou un delai bancaire automatique.
- Une contestation vide est refusee cote service, pas seulement dans l'interface.
- Trois tests d'integration passes sur base isolee : droits organisateur/beneficiaire et reception unique ; contestation puis correction conservant les deux preuves et l'ancienne reference dans l'audit ; refus d'une reference courante deja utilisee. TypeScript valide.
- Suite unitaire complete relancee : 627 tests passes dans 124 fichiers. ESLint cible et git diff --check valides. Aucun nouveau build ni deploiement pour ce lot.
- Ecarts encore ouverts : unicite atomique des references historiques apres correction (l'index ne couvre que la reference courante), notifications durables et notification de resolution motivee, controles de preuve/destination. Les tests emploient une notification simulee et ne valident aucun transfert d'argent reel.

## Lot 9 : unicite des references successives

- Ajout append-only de declaredReferences lors de chaque declaration, protege par un index unique compose avec l'organisateur. La correction ne libere plus une ancienne reference dans les nouveaux dossiers.
- Recherche preventive dans la reference courante, la liste et l'audit historique. Conflit d'index traduit en reference_already_used, sans preuve ajoutee ni notification pour la declaration refusee.
- Cinq tests d'integration reussis : correction puis tentative de reutilisation, refus direct par l'index, deux declarations simultanees, recherche d'un ancien audit, parcours de declaration/reception.
- Reprise historique obligatoire avant deploiement decrite dans REMBOURSEMENTS_REFERENCES_V1.md ; aucune migration de production effectuee. Les conflits historiques ne sont ni effaces ni resolus automatiquement.

## Lot 10 : retrait de la revente native

- Depot LIB_Mobile inspecte, modifications preexistantes conservees. Guide Expo 57 consulte conformement a son AGENTS.md.
- Suppression des annonces et appels de revente dans la fiche evenement, du formulaire et du retrait de vente dans Mes billets, des statistiques de revente et de sa promotion dans l'onboarding. Le partage gratuit du QR reste intact.
- Ancien lien checkout/resale redirige vers Mes billets sans WebView ni paiement. Les anciennes fonctions exportees retournent une indisponibilite/liste vide, sans importer de client reseau.
- Nouveau test executable scripts/test-v1-resale.mjs : cinq appels sans reseau et quatre controles de structure. Ajoute a check:quality ; l'ancien critere QA validant un paiement simule de revente est remplace par un controle de desactivation.
- TypeScript et premiere execution de check:quality passes. Export local Expo Android et iOS reussi dans /tmp/lib-mobile-v1-no-resale. Ce sont des bundles JavaScript/Hermes, pas des APK/IPA installes ni une publication sur stores.
- Pas de verification visuelle sur appareil pour ce lot. Inscriptions natives encore non conformes (SIRET et autres etapes), presence native et parite remboursement/paiement restent a traiter.

## Lot 11 : inscriptions mobiles simplifiees

- Suppression des champs SIRET/SIREN organisateur et prestataire, de leur validation locale et des tarifs min/max prestataire. Les sous-titres ne promettent plus une inscription avec tarifs ni une activite dans plusieurs pays.
- Nettoyage des payloads inscription/soumission/brouillon, y compris anciens champs recharges : identifiant entreprise retire, tarifs retires pour le prestataire. Pour l'organisateur, seul le document identity est transmis et son libelle precise le titulaire du compte. Les justificatifs prestataire par categorie restent conformes a la regle serveur existante ; leur suppression generale n'a pas ete extrapolee.
- Composant partage de mot de passe avec aide par icone, deux champs distincts et controle de confirmation avant inscription. Le mauvais import IconButton trouve par TypeScript a ete corrige.
- Nouveau test executable test-v1-signup.mjs : validation sans identifiant, refus de pays hors lancement, liste des documents organisateur, cinq payloads d'API avec ancien brouillon et absence de mutation de ce brouillon ; controles de structure des champs/aide/confirmation. API simulee, aucune creation reelle de compte ni upload.
- check:quality final passe, incluant TypeScript, contrats API, gardes QA/UI, revente et inscriptions. git diff --check passe. La validation sur appareil, le clavier, la lecture vocale, les vrais uploads et le parcours complet restent ouverts.
- Export Android/iOS local reussi dans /tmp/lib-mobile-v1-signup ; bundles Hermes uniquement, pas de build signe ou de publication.

## Lot 12 : presence globale mobile

- Composant AccountPresence monte sous AuthProvider pour tous les ecrans. POST authentifie /api/users/presence toutes les 20 secondes, uniquement si session chargee et application active ; aucun nouveau endpoint public ni collecte de localisation.
- Controleur sans requetes concurrentes, annulation et arret des timers en arriere-plan/deconnexion, reprise immediate au retour. Focus/blur Android, AppState iOS/Android et visibilite web geres. Les erreurs reseau n'interrompent pas l'interface.
- Cinq tests locaux passes : periodicite, requete lente et ancienne reponse, arriere-plan/retour, erreur reseau, demontage et gardes de raccordement. check:quality complet et git diff --check passent.
- La fenetre serveur de presence reste 45 secondes : la deconnexion devient visible apres expiration, pas par un signal global hors-ligne qui couperait une autre session active. Les tests ne prouvent pas encore les evenements OS sur telephone ni la suppression effective d'un e-mail reel.

## Lot 13 : prix et option au checkout mobile

- Total estime incluant les frais LIB, calcules par admission pour les groupes. Nombre definitif d'entrees et type groupe proviennent de l'offre chargee, pas du parametre isTable du lien.
- Devise explicite de l'evenement preservee : une offre EUR au Benin n'est plus reetiquetee XOF. Ce checkout refuse les offres non XOF ; startCheckout refuse EUR sans appel reseau et n'utilise que FedaPay.
- Option soumise a l'activation de la categorie, au seuil/plafond et a fermeture moins 48 h ; reevaluation pendant l'affichage et avant validation. Texte R58 et distinction entre estimation, promotions serveur et frais techniques eventuels. Reessayer recharge l'offre au lieu de repeter indefiniment une selection devenue invalide.
- Cinq tests executables passent, dont parite avec les fonctions serveur sur 55 combinaisons prix/quantite/admissions, limites horaires, refusal EUR et preservation de sa devise. check:quality complet et git diff --check passent.
- Limites : pas de transaction FedaPay reelle ni de validation visuelle sur appareil ; precommandes avancees, checkout des blocages de place, agents et autres surfaces monetaires restent a auditer. Le catalogue de production et les montants historiques ne sont pas modifies.

## Lot 14 : presentation des billets mobiles

- QR non genere/non partageable pour billet scanne, annule, evenement absent ou annule, demande de remboursement connue. Libelle "Billet a presenter" pour le cas disponible, sans presenter le cache local comme une verification serveur.
- Apres acceptation d'une demande, masquage immediat de tous les QR de la meme commande dans le groupe affiche, avant retour du rafraichissement reseau. Actualisation des billets au retour sur l'ecran via useFocusEffect.
- Retrait du raccourci de commande au bar apres achat et d'un dernier texte promotionnel de revente sur l'etat deconnecte. Les anciennes routes de commande autonome restent a auditer/bloquer selon CONSO-01 ; ce changement d'interface seul ne constitue pas cette protection serveur.
- Huit tests locaux passes (decision de presentation et controles de structure), check:quality complet et git diff --check passes. Pas encore de test visuel sur appareil ni de preuve de controle hors ligne. Les caches anciens sur d'autres appareils et les droits du scan doivent toujours etre controles par le serveur.

## Lot 15 : fermeture de l'ajout autonome de consommations

- POST /api/event-orders/add refuse les nouvelles commandes autonomes en V1 (410), quel que soit le role authentifie ; non authentifie reste 401. Aucun service de creation ni acces base n'est appele par cette route.
- Message metier traduit dans l'ancien client web. Les endpoints de materialisation des precommandes payees, consultation, remise, historique et regularisation ne sont pas supprimes.
- Quatre tests de route passes (anonyme, client, organisateur, agent), TypeScript valide. Tests avec authentification/service simules, sans commande reelle.
- CONSO-01 reste partiellement traite : anciens ecrans web/mobile de commande a convertir en suivi, garde du service interne et augmentation de quantite d'une ancienne ligne a revoir, anciennes suites d'integration a adapter sans perdre les tests de remise/historique. Cette fermeture d'un endpoint ne certifie pas tout le parcours de consommations.

## Lot 16 : quantites verrouillees et suivi web des consommations

- Le service de modification refuse toute augmentation, pour les quatre rangs d'acces. Les lignes preorder/included ne peuvent pas changer de quantite, meme en absence de paidAt. La reduction d'une ancienne ligne order non payee/non servie reste possible dans le service, avec droits et audit existants.
- Trois tests MongoDB verifies sur la base isolee : documents identiques avant/apres refus pour order, preorder et included. Autorisation simulee dans ces tests ; transaction et stockage reels.
- Ancienne page web /order convertie en suivi en lecture seule : aucun menu d'ajout ni modification/suppression, actualisation explicite, etat vide et erreur de lecture distincts, lignes annulees conservees. Un billet revoque ou un evenement termine/annule n'empeche plus son proprietaire de consulter l'historique ; cela ne redonne aucun droit d'entree. Controle de propriete serveur conserve.
- Raccourci du portefeuille web renomme Consommations. Les montants historiques gardent leur devise d'origine ; aucune reecriture financiere. Une annulation de ligne n'est pas presentee comme un remboursement confirme.
- Six tests de rendu serveur/page avec dependances simulees : lecture seule, vide, historique apres annulation, refus d'un autre proprietaire, erreur de lecture, authentification. Pas encore de recette visuelle navigateur pour cette page ni de test du clic Actualiser.
- Suite unitaire web complete : 643 tests / 126 fichiers passes. TypeScript, ESLint cible et git diff --check passes. Les trois tests MongoDB sont additionnels a cette suite.
- Build de production local passe : 186 pages statiques generees, MONGODB_URI forcee vers la base isolee. Avertissement existant de Cache-Control personnalise sur les assets Next. Aucun deploiement effectue.
- Reste ouvert : service interne d'ajout legacy, anciens ecrans natifs de commande, adaptation des anciennes integrations qui creent des commandes autonomes, recette de materialisation/remise/statistiques et deploiement. CONSO-01 reste partiel.

## Lot 17 : suppression de la creation autonome dans le service interne

- addOrderItem et addEventOrderItem renvoient 410 standalone_orders_disabled_v1 sans connexion base ni mutation. Suppression du code legacy de creation/fusion ; la materialisation des precommandes reste une operation distincte.
- Les integrations ne creent plus de commandes via ce service pour preparer un test de remise. Des fixtures historiques explicites inserent les lignes et leurs anciens journaux ; les actions de service, encaissement, annulation, reduction, suppression et leurs journaux restent reellement executees.
- Recette MongoDB : 21 tests passes sur deux fichiers, dont 18 de la suite eventOrders. Refus pour proprietaire, client, tiers, scan, serveur et manager ; ajout repete ne modifiant ni document ni journal. Maintien de la couverture de droits, scoping, idempotence, double encaissement et exclusion des lignes annulees/precommandees.
- Sept tests unitaires du service et quatre tests de route passes ; TypeScript et ESLint cible passes. Aucune base de production modifiee, aucun deploiement.
- Suite unitaire web complete repassee : 644 tests / 126 fichiers. Le dernier build reste celui du lot 16 ; pas de nouveau build pour le lot 17.
- Points ouverts : ancien ecran de commande natif ; materialisation encore fondee sur les donnees du billet sans garde explicite paid/revoked dans la lecture examinee ; recette complete achat/remise et chiffres de consommation. Ne pas assimiler la fermeture des ajouts a la conformite de tout CONSO-01/02.

## Lot 18 : suivi natif des consommations

- Ancien ecran /order natif remplace par un suivi en lecture seule : retrait du menu, achat, suppression et total trompeur a regler au bar (qui incluait les precommandes). Quantites, types et etats servis/annules conserves ; aucune annulation presentee comme remboursement confirme.
- Consultation sans fenetre horaire d'achat ni dependance a la fiche publique de l'evenement. Acces authentifie, lecture API cloisonnee existante, refus et erreur reseau distincts d'un vrai historique vide.
- Chargement au focus et actualisation manuelle ; annulation au depart et garde contre reponses tardives. Sous-composant remonte a chaque changement utilisateur/billet ; pas de reutilisation d'etat de l'ancien compte dans cet ecran.
- Fonction native addOrderItem conservee pour compatibilite mais refuse localement sans appel reseau. Les fonctions staff de remise et d'encaissement historique restent distinctes.
- check:quality complet passe, dont TypeScript et quatre nouveaux tests (API simulee et gardes de structure) ; git diff --check passe. Ces tests ne remplacent pas le rendu sur appareil ni la recette de changement de session avec serveur reel.
- Export local Android/iOS reussi dans /tmp/lib-mobile-v1-consumptions : bundles Hermes uniquement, pas d'APK/IPA signe ni publication.
- Restent les gardes serveur de materialisation/remise, le parcours reel achat avec consommations, stocks et statistiques. Aucun deploiement ni publication mobile effectue.

## Lot 19 : garde transactionnelle de preparation des consommations

- Materialisation reservee aux billets paid=true et non revoques du bon evenement. Controle et lecture des precommandes deplaces dans la transaction ; compteur consumptionRevision ecrit sur le billet pour entrer en conflit avec une revocation concurrente portant sur ce document.
- Refus ticket_unavailable sans creation de lignes/journal pour billet indisponible. Les candidats ne sont plus calcules depuis un billet lu avant ouverture de la transaction. Aucun changement de donnees historiques ou de monnaie.
- Tests ajoutes sur MongoDB isole : non-paiement, revocation, revocation injectee juste avant le verrou, rollback complet en cas d'echec du journal. Le test de revocation simule cet ordre precis ; il ne constitue pas une recette exhaustive de toutes les courses distribuees.
- Suite eventOrders : 22 tests passes ; TypeScript, ESLint cible et git diff --check passes. Pas de nouveau build, de recette appareil ou de deploiement pour ce lot.
- Reste ouvert : controle equivalent lors de la remise d'une ligne deja materialisee, annulation evenement concurrente, retrait des missions, valeurs incluses encore reprises depuis l'offre courante et recette achat/remise complete. La preparation protegee ne suffit pas a certifier CONSO-01/02.

## Lot 20 : garde transactionnelle de remise

- serveEventOrderItem reverifie le billet paid/non-revoque du bon evenement avant toute nouvelle remise. Ecriture consumptionRevision dans la meme transaction que la ligne et son journal, pour entrer en conflit avec une revocation concurrente.
- Une ligne deja servie reste idempotente, sans nouvelle remise ni journal ; une ligne annulee reste refusee. Refus ticket_unavailable traduit dans les scanners web et natif.
- MongoDB isole : 25 tests eventOrders passes, dont deux invalidations apres materialisation et deux remises simultanees produisant une seule action serve. Tests de service/utilitaires web : 12 passes. TypeScript web et ESLint cible passes ; check:quality natif complet passe, dont cinq tests consommations. git diff --check passe dans les deux depots.
- Pas de nouveau build ni de recette appareil/deploiement. Restent notamment annulation evenement et retrait de mission concurrents, snapshots des inclus, stocks/statistiques et recette globale. Le menu d'ajout staff natif subsiste visuellement mais son appel est refuse : a supprimer de l'interface plutot que laisser des actions sans effet.

## Lot 21 : retrait des menus d'achat agents

- Scanner natif : menu d'ajout et fonction associee retires. Encaissement affiche uniquement pour anciennes lignes order non payees/non annulees ; les precommandes et inclus ne sont plus comptes comme une dette au bar. Bouton Retirer reserve aux anciennes lignes order non payees, pas aux precommandes.
- Scanner web : menu d'ajout, appels add/update-quantity et controles de quantite retires. Scan, service, regularisation historique, annulation et consultation du journal conserves. Les protections serveur des lots precedents restent la frontiere de securite.
- Nouveau test natif du montant historique et gardes structurelles des scanners. check:quality mobile complet passe, dont six tests consommations ; TypeScript web, ESLint cible et diff-check passent. Les gardes de source ne remplacent pas une recette de rendu/interactions.
- Suite unitaire web complete : 647 tests / 127 fichiers passes. Build web de production local passe (186 pages statiques), base MongoDB de test explicite ; avertissement Cache-Control existant. Aucun deploiement ni nouveau bundle natif exporte pour ce lot.
- Restent notamment erreurs/annulation du chargement et changement de session du panneau staff natif, protection serveur de suppression des precommandes, stock/inclus historiques/statistiques et recette sur appareils. Aucune publication effectuee.

## Lot 22 : preservation des consommations achetees

- Le service remove refuse de supprimer une ligne preorder/included non encore servie, meme sans paidAt. La verification de propriete precede ce refus ; les lignes deja verrouillees conservent leur comportement sans mutation.
- Huit cas unitaires couvrent les deux types pour les quatre rangs et verifient absence de suppression, sauvegarde et journal. Integration reelle : precommande et inclus materialises puis huit tentatives par owner/scan/serveur/manager ; documents et journal strictement conserves.
- 13 tests du service remove et 26 tests MongoDB eventOrders passes ; TypeScript, ESLint cible et diff-check passes. Les tests de suppression d'anciennes lignes non payees restent actifs et passes.
- Libelle d'erreur web ajoute. Aucun nouveau build/deploiement ni recette appareil pour ce lot. Annulation tracee, remboursement et suppression sont distincts : ce changement ne decide pas du montant remboursable des consommations.

## Lot 23 : indicatifs de contact independants du catalogue

- Liste d'indicatifs construite depuis les metadonnees libphonenumber-js installees, sans utiliser regions. Dedoublonnage des indicatifs partages et +229 en premier ; catalogue et pays professionnels toujours Benin-only.
- Selecteurs web client, organisateur, prestataire et profil raccordes a cette liste. Decoupage du numero existant dans le profil generalise aux indicatifs disponibles, sans remplacer le numero national stocke.
- Validation : suppression du retrait aveugle des zeros nationaux avant interpretation par la bibliotheque. Defaut reproduit localement sur un numero italien valide avec zero significatif ; format francais avec zero national toujours accepte.
- 19 tests cibles passes (indicatifs, validation, profil), TypeScript et diff-check passes ; ESLint cible sans erreur, avertissement PHONE_RE preexistant dans AuthForm. Tests de validation et fonctions, pas de nouvelle inscription reelle ni de verification OTP.
- Restent parite native, normalisation canonique au stockage, recette navigateur et validation exhaustive du format Benin. Le choix du prestataire OTP et les numeros de paiement ne sont pas modifies. Pas de nouveau build/deploiement.

## Lot 24 : telephone natif et parite des indicatifs

- Inscriptions organisateur/prestataire : indicatif auparavant fixe et invisible rendu editable, separe du numero national. L'inscription client conserve son champ international libre ; aucune limitation automatique des contacts au +229.
- Profil natif : liste d'indicatifs independante de REGIONS et decoupage par indicatif reel, remplacant la regex gloutonne qui absorbait jusqu'a quatre chiffres apres le +. Rechargement d'un profil sans telephone remet aussi les champs a vide/+229.
- Snapshot local des indicatifs web pour ne pas ajouter une dependance native ; test de parite obligatoire avec les metadonnees web installees. Les pays du catalogue restent Benin uniquement.
- check:quality complet passe, dont sept nouveaux tests (parite, cinq decoupages, raccordement des champs). TypeScript et diff-check passes. Ces tests ne prouvent ni la possession du numero ni une inscription/reconnexion reelle sur appareil.
- Build web local passe (186 pages, base de test explicite) ; export Hermes Android/iOS reussi dans /tmp/lib-mobile-v1-phone. Ni APK/IPA signe ni publication. Avertissement Cache-Control web existant.
- L'extraction initiale via tsx a echoue a cause d'une interop JSON de la bibliotheque ; extraction faite avec Node ESM direct et parite verifiee par le test. Aucun secret ou numero utilisateur reel lu/modifie.
- Restent normalisation canonique au stockage, format Benin exhaustif, OTP et recette des interactions/sauvegarde. Aucun deploiement/publication effectue.

## Lot 25 : sauvegarde du telephone de profil sans perte de chiffres

- updatePhone ne supprime plus les zeros initiaux avant stockage. Normalisation partagee conservant les zeros significatifs et les formats Benin actuellement acceptes ; pas de conversion implicite des anciens numeros beninois a huit chiffres.
- Ponctuation de presentation retiree ; numero international canonique obtenu via la bibliotheque pour les autres pays. Texte alphabetique, numero complet dans le champ national et indicatif mal forme refuses.
- Comparaison des telephones deja stockes normalisee aussi : un ancien +33 06... est reconnu comme le meme numero que +33 6... ; profil refuse conserve. La regle existante de doublon liee a un autre compte verifie n'est pas changee en preuve de possession du telephone.
- 17 tests unitaires cibles et 28 tests MongoDB profil passes (quatre nouveaux cas de sauvegarde/doublon), TypeScript/ESLint cible/diff-check passes. Base isolee uniquement.
- Restent inscriptions client/professionnelles a raccorder au normaliseur, concurrence des controles de doublon, migration auditee des numeros historiques deja alteres, OTP et recette reelle. Aucun nouveau build/deploiement pour ce lot.

## Lot 26 : telephone a l'inscription client

- API client raccordee au normaliseur : telephone fourni valide et enregistre sous forme canonique ; numero absent ou vide toujours autorise. Les formats invalides ne creent ni compte ni e-mail. Comparaison canonique des anciens numeros pour la regle existante de doublon.
- Messages invalid_phone explicites dans les inscriptions web et native, au lieu d'un message trompeur sur le mot de passe ou d'une erreur generique.
- Adaptateur authApi natif corrige apres detection TypeScript : invalid_phone n'est plus reduit a invalid. Huit tests natifs telephone passes, dont le parcours adaptateur simule vers le code d'erreur utilise par l'ecran.
- Huit tests MongoDB passes : quatre numeros internationaux, absence/vide, refus invalide et doublon historique. Comptes reels dans la base isolee ; e-mails, emission du jeton, rate limit et observabilite simules. TypeScript web/natif passe ; ESLint cible sans erreur (PHONE_RE preexistant), diff-check passe.
- Restent inscriptions professionnelles, concurrence du doublon telephone, historique et OTP. Pas de nouveau build/deploiement ni de recette des formulaires sur appareil.

## Lot 27 : telephone a l'inscription professionnelle

- Organisateur et prestataire : normaliseur partage avant creation du compte. Le telephone organisateur n'est plus laisse vide ; celui du prestataire n'est plus une concatenation brute. Numero invalide refuse avant compte et upload.
- Donnees du dossier soumises conservees telles que saisies ; pas de migration silencieuse ni de verification de possession deduite du format. Types commerciaux dedies conserves.
- Huit nouveaux tests professionnels (deux types, trois formats et refus invalide) et huit tests client passes sur MongoDB isole. Compte/dossier reellement enregistres en base de test ; Cloudinary et notifications simules. TypeScript, ESLint cible et diff-check passes.
- Restent normalisation/coherence des modifications ulterieures de dossier et des profils publics, migration historique auditee, OTP et recette reelle. La regle legacy de doublon telephone des parcours client/profil n'est pas une nouvelle exigence d'unicite globale et doit etre revue face aux comptes dedies. Aucun build/deploiement pour ce lot.

## Lot 28 : ne pas rembourser automatiquement un telephone de contact

- Suppression de la deduction dangereuse FedaPay = Mobile Money et contact commande/profil = compte payeur. Ni la creation d'un dossier individuel, ni la bascule depuis un retrait ne verrouillent desormais une destination non attestee.
- Sans destination de paiement attestee, le dossier reste a preparer avec collecte et verification des coordonnees ; la bascule invalide toujours le code de retrait atomiquement. Aucun compte utilisateur ni ancienne destination modifie silencieusement.
- Quatre nouveaux tests MongoDB couvrent contact de commande et profil seul, creation et bascule, refus tiers et seconde bascule. Les 27 tests destination/demande/declaration passent sur base isolee. Premier passage : un test existant depasse 5 secondes ; relance complete avec testTimeout=30000 reussie, assertions inchangees. TypeScript, ESLint cible et diff-check passes.
- Ceci ferme une mauvaise destination automatique, pas toute REM-29/30 : restent capture attestee du moyen/compte payeur, restrictions selon le moyen original, preuve de titularite et migration auditee des anciennes destinations verrouillees. Le rail FedaPay seul ne distingue pas carte et Mobile Money. Aucun paiement externe, build ou deploiement effectue.

## Lot 29 : verification avant declaration et ecriture conditionnelle des coordonnees

- Declaration desormais refusee depuis individual_generated : soumission puis verification necessaires avant to_refund. Boutons web et natif alignes ; nouvelle declaration apres contestation disponible sur les deux surfaces.
- Soumission des coordonnees par mise a jour conditionnelle sur statut/type/destination lue, avec audit dans la meme operation. Une verification intervenue apres lecture ne peut plus etre ecrasee par save(). Verification refusee sans destination chiffree non vide et type admissible.
- 31 tests MongoDB remboursement passes, dont quatre nouveaux cas : declaration prematuree, destination absente, parcours autorise complet et interleaving lecture/verification/ecriture force. Base isolee, notifications simulees ; TypeScript web/natif et ESLint cible passes (warning setStatus preexistant), diff-check des deux depots passe.
- Restent consultation controlee des coordonnees sensibles par l'organisateur (aucun appel serveur a leur dechiffrement repere), preuve de titularite, liaison de la verification a la version effectivement consultee et moyen de paiement original atteste. Ces tests ne prouvent pas une verification bancaire ou une remise d'argent. Pas de build/deploiement ni de recette appareil dans ce lot.

- Suite unitaire web complete relancee : 671 tests passes dans 129 fichiers. Cette preuve ne couvre pas les tests d'integration non executes ni les parcours sur appareil.

## Lot 30 : consultation confidentielle et verification de la version consultee

- Nouvelle route POST organizer-refunds/:id/destination : session obligatoire, organisateur du dossier uniquement, dechiffrement a la demande, cache private/no-store y compris erreurs. Lecture journalisee sans coordonnees en clair dans l'audit ; refus si cle/chiffrement indisponible ou destination modifiee pendant la lecture.
- Verification exige la version de la destination consultee, derivee du dossier/type/chiffrement. Comparaison puis ecriture conditionnelle sur la destination : ancienne lecture ou modification concurrente ne peuvent valider une nouvelle destination. Anciennes applications sans version recoivent un refus explicite, pas un contournement.
- Web : modale de consultation puis confirmation du titulaire. Native : consultation explicite, confirmation distincte, masquage au depart de l'ecran et rejet des reponses de lecture tardives. Coordonnees non ajoutees aux listes generales ni aux exports.
- 35 tests MongoDB remboursement passes, dont acces tiers, audit sans texte sensible, version perimee, chiffrement invalide et modification forcee pendant verification. Trois tests route passent (session, autorisation deleguee, no-store). TypeScript web/natif et ESLint cible passent (warning setStatus preexistant). Check:quality natif passe avant le dernier renforcement de masquage ; TypeScript natif relance apres celui-ci. Diff-check des deux depots passe.
- Un premier test de route attendait a tort undefined plutot que le contexte d'audit simule {}; assertion corrigee. Typage corrige pour le type optionnel historique de destination. Pas de build/deploiement ni test sur appareil. Restent vraie preuve de titularite et destination originale attestee, migration historique, recette de confidentialite lors des changements de session/arriere-plan, limites d'acces/conservation et preuves de paiement privees.

## Lot 31 : e-mail durable de decision sur contestation

- La decision motivee enregistre une intention d'envoi dans la meme operation atomique. Nouveau modele d'e-mail en francais, texte echappe, sans annoncer reception d'argent ni nouveau remboursement.
- Worker avec bail et reprise, payload chiffre fige (destinataire/expediteur/contenu), cle d'idempotence stable et arret automatique des reprises apres 23 heures avec signalement uncertain/HTTP 503. Cron protege configure toutes les cinq minutes et index non unique ajoute au script d'index ; aucun lancement en production.
- Cinq tests MongoDB nouveaux : intention durable, contenu/etat financier, echec et reprise identique, deux workers, fenetre de deduplication, destinataire absent et bail expire. Total des quatre suites remboursement : 40 tests passes. Deux tests cron passent. Suite unitaire complete : 676 tests dans 131 fichiers passes. TypeScript et ESLint cibles passes ; une erreur initiale de type litteral du filtre Mongo a ete corrigee.
- Fournisseur simule, aucune livraison reelle prouvee. sent signifie acceptation fournisseur uniquement. Documentation REMBOURSEMENTS_EMAILS_CONTESTATION_V1.md : deploiement/configuration/index, revue manuelle des incertitudes, anciennes contestations sans reenvoi aveugle, conservation et notifications restantes.

## Lot 32 : restitution transactionnelle du stock apres declaration d'une option

- Declaration du remboursement et restitution de stock executees dans la meme transaction MongoDB. Uniquement cause cancellation_option, commande payee XOF avec stock effectivement decremente ; marqueur refundStockReleasedAt empechant une seconde restitution apres contestation/nouvelle declaration.
- Groupe : restitution de qty ; table : une unite, pas le nombre d'admissions. Pas de restitution sur evenement annule, ni assimilation d'un report refuse a une option. Stock incoherent/categorie absente : refus explicite, aucune preuve/declaration partiellement enregistree.
- Sept tests nouveaux couvrent autorisation, groupe, table, concurrence, seconde declaration, capacite incoherente, evenement annule, autre cause et rollback force apres ecriture du stock. Les cinq suites remboursement totalisent 47 tests passes sur MongoDB isole ; notifications simulees. TypeScript, ESLint cible et diff-check passent.
- Les fixtures de declaration possedent maintenant leur commande reelle plutot qu'une reference vers une commande inexistante. Pas de migration de stock historique ni de changement de chiffre d'affaires. Restent commandes de blocage/solde et leurs regles finales, donnees historiques, statistiques remboursees et recette complete achat/annulation/remboursement/rachat. Aucun build ou deploiement dans ce lot.

## Lot 33 : verification globale et contact partage entre comptes dedies

- Build web de production local reussi apres le lot 32 : 187 pages statiques, URI MongoDB de test explicite et cles d'envoi/paiement desactivees. Avertissement Cache-Control existant. Check:quality natif complet passe, avec 173 endpoints visibles et 241 routes web dans le controle statique de contrat. Ni deploiement ni recette appareil.
- Ensuite, suppression du blocage legacy phone_taken dans l'inscription client et la modification du telephone. Le contact peut etre partage entre comptes dedies, comme dans les inscriptions professionnelles ; l'e-mail reste globalement unique. Aucun compte fusionne ni telephone transforme en identifiant d'authentification ou preuve de possession.
- 47 tests MongoDB inscription/profil passes : contact normalise partage, compte professionnel existant intact, refus d'e-mail deja utilise pour chacun des trois types, et regressions de profil. Notifications/uploads simules. Liste de roles de test typee litteralement apres erreur TypeScript initiale ; verification relancee. ESLint cible et diff-check passes.
- Le build precede le dernier ajustement telephone ; ne pas le presenter comme recompilation de cet ajustement. Restent OTP, eventuelle recherche agent ambigue par telephone a cadrer, donnees historiques, dossiers modifies et recette reelle des trois inscriptions.

## Lot 34 : statistiques et consommations annulees

- Le calcul excluait deja les precommandes materialisees annulees ; recette actualisee Cotonou/Benin/XOF et cas toutes lignes annulees ajoutant la preuve qu'aucun repli sur le billet ne regonfle le montant.
- Precommandes rattachees a un billet non paye exclues des recettes estimees ; billets revoques deja exclus. Les invitations restent comptees comme billets gratuits. Libelles clarifies : estimation des billets valides, pas comptabilite des encaissements/remboursements, sans reference Stripe obsolete.
- Demographie appliquee aux memes billets filtres que les indicateurs principaux. Suppression des trois requetes de compteurs de revente ; champ de compatibilite renvoyant zero en V1, sans consultation de l'historique.
- Sept tests MongoDB et vingt tests unitaires de statistiques passes ; TypeScript, ESLint cible et diff-check passes. Premiere fixture toutes consommations annulees corrigee avec titulaire requis ; notifications de creation evenement desormais simulees. Base isolee uniquement.
- Restent consentement explicite pour analyses demographiques, reconciliation orders/refunds/consommations et tableaux de bord multiples, fuseau des series, recettes historiques EUR et qualification des stocks reserves vs vendus. Pas de build/deploiement ou recette navigateur/appareil pour ce lot.

## Lot 35 : jours de vente et horaires par defaut du Benin

- Helper de jour calendaire Africa/Porto-Novo pour series de ventes et annee du calcul d'age. Date manquante/invalide ou timestamp sans fuseau non devine : pas de ligne artificielle au 1er janvier 1970. Le total des billets conserve les billets sans date, exclus seulement de la serie datee.
- event-time utilise desormais le Benin UTC+1 si la region manque, au lieu de Lome UTC+0. Aucune date en base reecrite ; fermeture explicite conserve sa priorite. Les historiques sans region doivent etre audites avant migration/deploiement, pas assimiles sans controle a une conversion de donnees.
- Tests minuit, changement d'annee, fuseau explicite, absence de date et soiree traversant minuit ajoutes. Premiere suite complete : deux tests d'urgence dependants de l'ancien fuseau ; fixtures corrigees avec instants +01:00 explicites. Le test sous New York a revele le calcul d'annee machine, corrige avec le jour beninois.
- Suite complete : 690 tests passes dans 132 fichiers. 37 tests cibles passes aussi avec TZ=America/New_York ; TypeScript, ESLint et diff-check passes. Pas de nouveau build/deploiement ou de test appareil.
- Restent filtres de dates dans les annuaires, cas evenements en cours apres minuit, donnees historiques et parite des calculs natifs. Le consentement demographique et la reconciliation financiere ne sont pas valides par ces tests horaires.

## Lot 36 : annuaire organisateurs filtre avant pagination

- Remplacement du filtre applique apres skip/limit par une aggregation commune de selection/comptage. Une page filtree n'est plus vide simplement parce que les premiers profils tries n'ont aucun evenement. Totaux et pages issus du meme facet ; ancien cache de compteurs et calcul du jour UTC supprimes. La chaine upcoming=false est correctement fausse.
- Selection du prochain evenement avant groupement/limite : exclut termines, annules, demos/labels, anciens prives, publication future et EUR/hors Benin. Horaires Mongo alignes sur event-time en UTC+1, incluant une soiree de la veille encore en cours et la fermeture exacte. Pas de recherche bornee au seul jour UTC.
- La recette a revele que le schema Event ne declarait pas isDemo/demoLabel pourtant utilises par les filtres. Champs ajoutes et type partage demoLabel rendu nullable ; pas de requalification automatique des donnees historiques. Exclusion demos/prives aussi sur getOrganizerEvents.
- Huit tests MongoDB passes : 14 profils et pagination filtree, prochain evenement apres anciens/placeholder, changement de jour et fermeture, criteres de publication/perimetre, cinq cas de parite horaires et page publique sans demos. Suite unitaire 690/132 repassee pendant ce lot ; TypeScript final, ESLint cible et diff-check passes. Base isolee, aucun deploiement.
- Restent recette navigateur des controles, plan d'execution/performance sur volumetrie reelle, donnees geographiques incoherentes et historique dont le marqueur demo aurait deja ete perdu. Ce lot ne migre ni ne supprime le catalogue de production.

## Lot 37 : prix publics prestataires et compteur Tous

- Filtrage des offres avec leur devise stockee AVANT normalisation de la vue publique en XOF. Une offre sans devise propre herite uniquement de la devise documentee du catalogue ; EUR ou devise inconnue masques, montants XOF conserves sans conversion. Meme traitement sur fiche, annuaire et liste SEO. Offres indisponibles masquees ; vue interne agent et documents historiques inchanges.
- Compteur Tous independant de la categorie selectionnee, conservant recherche et region. Pas de somme des categories : un profil multi-metiers ne doit pas etre compte plusieurs fois. Categories alternatives toujours presentes meme si la selection est vide.
- Quatre tests MongoDB isoles passes, dont comparaison integrale du document avant/apres lecture publique et acces interne aux prix historiques. Trois tests de rendu serveur ajoutes ; premiere attente corrigee pour respecter l'echappement HTML normal des esperluettes, sans changement du rendu applicatif. Suite unitaire complete : 693 tests dans 133 fichiers passes. TypeScript, ESLint cible et diff-check passes.
- Restent donnees et prix reels a qualifier, renouvellement/expiration des abonnements, performance des compteurs par categorie et coherence des caches. Tests de rendu avec lecture simulee, pas recette navigateur/appareil ; aucune migration, conversion de prix, publication ni mise en production dans ce lot.

## Lot 38 : message standard et reveil email transactionnels

- Envoi standard : creation du message et mise a jour de l'apercu/revision/reveil email dans une transaction MongoDB unique. Controle d'appartenance du participant dans l'ecriture ; conversation disparue ou membre retire annulent l'insertion. Session toujours fermee, effets notifications/push apres commit uniquement.
- Six nouveaux tests MongoDB passent : commit, panne avant mise a jour, panne apres ecriture dans la transaction (rollback des deux documents), membre retire, conversation supprimee et dix envois concurrents sans perte/revision manquante. Suite rappels existante 19 tests repassee : 25 tests au total sur ces deux fichiers, fournisseur simule.
- Deux suites existantes messaging/messagingActions repassees ensuite : 72 tests MongoDB supplementaires, soit 97 tests d'integration passes dans ce lot, sur base isolee uniquement.
- Suite unitaire complete 693 tests / 133 fichiers repassee ; mocks du service adaptes aux sessions, TypeScript et ESLint cibles passes. Le cast de l'injection de panne a ete corrige pour le typage des surcharges Mongoose. Aucun deploiement ou test fournisseur reel.
- Restent atomicite des transferts/sondages, effets post-commit et retries client sans doublon, controles concurrents des blocages/sourdines et droits des destinataires. Ce lot ne revendique pas une transaction globale de toute la messagerie.

## Lot 39 : transaction commune pour transferts et sondages

- Extraction du helper persistMessageWithWake utilise par envoi standard, transfert, sondage texte et sondage evenement. Suppression des trois ecritures independantes des sondages (message, sauvegarde conversation, reveil). Transaction message/apercu/revision/reveil et appartenance du participant communes, session fermee meme en erreur.
- Neuf tests d'integration ajoutes aux six existants : pour chaque point d'entree transfert/poll/event_poll, commit et panne avant/apres mise a jour, verification qu'aucun message/apercu/reveil partiel ne subsiste. Recette elargie messaging, actions, polls, rappels et atomicite : 128 tests MongoDB passes sur cinq fichiers, base isolee et fournisseurs simules.
- Huit tests unitaires des services livraison/transfert passes ; TypeScript et ESLint cibles passes apres adaptation des types de payload et mocks de session. Pas de nouveau build, deploiement ou appareil.
- Suite unitaire complete repassee ensuite : 693 tests / 133 fichiers passes. Diff-check final sans erreur.
- La transaction des transferts est par destination. Restent resultat partiel multi-destinations, retries client, notifications/push apres commit, et modifications concurrentes de blocage/sourdine. Le filtre Benin des evenements partageables et des anciens snapshots doit aussi etre audite ; ce lot concerne la durabilite, pas une validation du catalogue partage.

## Lot 40 : evenements partageables soumis a la visibilite publique

- Partage evenement et creation de sondage evenement passent par getEventById au lieu de charger directement Event sans controle de catalogue. Refus uniforme 404 pour hors Benin, EUR/devise absente, annulation, demo/label/remplissage, publication future, evenement termine et identifiant malforme. Prix et snapshot autorises issus du document serveur, sans conversion.
- Correction supplementaire : getEventById n'excluait pas isPrivate alors que les listes le faisaient ; une fiche privee n'est plus exposee par ce lecteur public ni par les deux parcours de partage. Aucun historique de messages modifie.
- Douze nouveaux tests de visibilite en base isolee, sondages existants et atomicite repasses : 49 tests MongoDB passes sur trois fichiers. Anciennes fixtures de sondage EUR remplacees par Benin/XOF ; prix reels et votes restent verifies. Quatre tests unitaires de resolution des contenus passes, TypeScript, ESLint cible et diff-check passes.
- Suite unitaire complete repassee : 693 tests dans 133 fichiers passes.
- Restent transfert d'anciens snapshots, catalogue prestataire dans la messagerie, apercus natifs, droits au moment concurrent de l'envoi, coherences ville/region et donnees reelles. Pas de build/deploiement ni de recette navigateur/appareil dans ce lot.

## Lot 41 : offres prestataires partagees conformes au catalogue public

- Resolution des demandes catalogue via getProviderByUserId sans exception interne agent/proprietaire, au lieu de lire le profil brut. Memes controles de perimetre Benin, abonnement actif et offres disponibles/XOF que la fiche publique. Messages texte ordinaires et historiques non modifies.
- Devise ajoutee au snapshot catalogue transmis. Une offre explicitement XOF conserve son montant meme si le catalogue historique etait EUR ; devise implicite seulement si catalogue documente XOF. Pas de conversion ni reecriture des documents d'origine, contenu/prix client ignores.
- Neuf nouveaux tests MongoDB : profil hors perimetre/inactif, disponibilite, EUR explicite/implicite, devise absente, XOF explicite dans deux catalogues et XOF herite. Avec les quatre tests de catalogue et 53 de messagerie, 66 tests passes. Premiere recette a revele une ancienne fixture de profil sans abonnement/localisation : deux fixtures des gardes client/prestataire alignees Benin/XOF/actif, sans affaiblir les refus.
- Suite unitaire 693 tests / 133 fichiers passee, TypeScript et ESLint cibles passes, diff-check sans erreur. Verification terminee le 7 septembre 2026 sur base isolee ; pas de deploiement.
- Restent transferts d'anciens snapshots et rendu web/natif des devises historiques, expiration/grace des abonnements, droits concurrents et donnees de production. Le lecteur public actuel utilise subscriptionActive ; ce lot ne tranche pas la periode de grace.

## Lot 42 : rendu web des prix historiques de messages

- La carte evenement utilisait FCFA pour toute devise autre que EUR, y compris absente/inconnue. Nouveau lecteur de snapshot : montant numerique fini positif ou nul, XOF entier uniquement ; prix/devise ambigus affiches Prix a verifier, jamais converts. EUR connu conserve avec mention ancien tarif. Zero XOF n'est plus transforme en promesse Gratuit.
- JSON null/tableau/primitif/invalide et champs titre/date/image/id structures ne font plus planter le rendu React. Identifiant encode dans le lien. Aucune reecriture des messages en base et aucune reactivation d'evenements hors perimetre.
- Quinze tests de rendu serveur passes : XOF, ancien EUR, six cas de montant/devise ambigus, zero, quatre snapshots invalides, champs structures et contenu sans prix/JSON invalide. TypeScript, ESLint cible et diff-check passes. Pas de recette navigateur/appareil ou deploiement.
- Suite unitaire complete : 708 tests dans 134 fichiers passes. Aucun test MongoDB necessaire pour ce lot de rendu ; dernier lot d'integration documente separement.
- Restent rendu natif, autres types de cartes (catalogue/sondages/articles), anciens snapshots transferes, validation complete des images/liens et accessibilite visuelle. Ce lot ne pretend pas que le catalogue historique ou tous les rendus sont conformes.

## Lot 43 : carte native des evenements partages

- Le fil natif rendait event comme contenu texte JSON brut. Nouvelle MessageEventCard branchee avant ce repli, titre/date/prix et image, lien evenement encode et desactive sans identifiant. Branche classee parmi les actions imbriquees pour eviter le bouton parent sur la preview web.
- Lecteur de snapshot identique au web : XOF reel, EUR marque ancien tarif, devise/montant ambigus a verifier et repli sur donnees malformees. Test de parite exacte des deux sources. Aucun message historique reecrit.
- Cinq tests natifs ajoutes a check:quality : montants, ambiguite, donnees invalides, parite et raccordement/navigation. Erreur initiale de chemin du test de parite corrigee ; check:quality complet passe, TypeScript inclus, contrat API 173 endpoints/241 routes, controles statiques/simules et diff-check passent. Pas de test sur appareil.
- Export initial arrete par permission d'ecriture du journal .expo ; relance autorisee avec EXPO_NO_DOTENV=1 terminee avec succes dans /tmp/lib-mobile-v1-message-events. Bundles Android Hermes (1824 modules), iOS Hermes (1786 modules) et web (1508 modules) generes ; aucune publication ou app signee.
- Restent offres prestataires natives (prix sans devise et parseur trop permissif), sondages/articles, ancien transfert, images/liens et gestes/accessibilite sur telephone. Cette carte n'est ni une app signee ni une publication store.

## Lot 44 : offres prestataires natives avec devise et parsing defensif

- Extraction du parseur catalogItemShare : verification objet JSON, champs texte normalises, valeurs structurees ignorees, montant numerique fini non negatif et image distante HTTP(S) uniquement. Reexport compatible depuis lib/messaging. Aucun changement des messages en base.
- Carte native affichant priceLabel : XOF reel, EUR explicitement ancien tarif, Prix a verifier pour devise absente/inconnue ou montant ambigu. Pas de devise inventee pour les anciennes offres. Absence de montant ne devient pas zero/gratuit. Unite conservee separement.
- Navigation prestataire encodee et desactivee sans identifiant ; plus de lien vers undefined. Cinq tests comportementaux/structurels ajoutes, dix tests messages evenement/catalogue au total dans check:quality.
- check:quality complet repasse : TypeScript, contrat API 173 endpoints/241 routes et controles statiques/simules passent ; diff-check sans erreur. Pas de recette de rendu React Native sur appareil. Dernier export Expo au lot 43 precede ces changements ; pas de nouvelle publication/build signe.
- Restent rendu web du catalogue malforme, sondages/articles, transfert des anciens snapshots, verification des images distantes et gestes/accessibilite sur appareils. Le filtre des protocoles n'est pas une attestation de confiance de chaque domaine distant.

## Lot 45 : carte catalogue web alignee sur le natif

- Lecteur catalogItemShare identique au natif (comparaison de fichiers passee) branche sur la carte web. JSON non objet et champs structures ne font plus planter la carte ; lien absent sans prestataire, identifiant encode, champs texte echappes par React et images limitees aux protocoles HTTP(S).
- Prix et unite maintenant visibles : montant XOF conserve, ancien EUR explicitement identifie, Prix a verifier pour montant/devise ambigus ; aucun montant invente lorsqu'il est absent. Historique non modifie.
- Seize tests de rendu passes ; composant NextImage simule, donc pas une verification du chargement visuel des images. Suite unitaire complete : 724 tests dans 135 fichiers passes. TypeScript, ESLint cible et diff-check passent.
- Nouveau build Next termine avec succes (exit 0, 187 pages statiques) sur base MongoDB isolee avec cles Resend/FedaPay/Stripe vides ; fichier .env.local signale par Next mais URI et cles explicitement remplacees pour cette commande. Avertissement Cache-Control preexistant conserve a investiguer. Pas de deploiement.
- Restent validation visuelle responsive/accessibilite, images et domaines distants, rendus des sondages/articles et transferts d'anciens snapshots. Ces corrections ne constituent pas la recette integrale de la messagerie.

## Lot 46 : echec de notification distinct du succes du message

- Apres commit, les erreurs de notification in-app/push et de programmation du callback differe ne font plus echouer la reponse d'envoi d'un message deja enregistre. Isolation par destinataire : une panne n'interrompt pas les autres envois. Callback differe protege aussi lorsqu'il s'execute apres la reponse.
- Journalisation structuree du stade en erreur uniquement, sans contenu, identite, adresse e-mail ou message d'erreur fournisseur potentiellement sensible. Ce journal ne certifie pas la livraison et ne constitue pas une file de reprise des push.
- Six nouveaux tests MongoDB : notification in-app, push, relecture destinataires, ordonnanceur differe, execution tardive et echec avant commit. Verification d'un seul message persiste avec reveil durable, autres destinataires traites, logs sans contenu prive. Avec atomicite et rappels : 40 tests integration passes. Typage d'une fixture corrige ; TypeScript, ESLint cible et diff-check passes.
- Suite unitaire complete repassee : 724 tests dans 135 fichiers passes.
- Restent delais des effets post-commit, file durable pour in-app/push, reponse perdue/retry client avec cle idempotente, autorisations concurrentes et transferts multi-destinations partiels. La sauvegarde elle-meme reste faillible et ses erreurs ne sont pas masquees. Pas de build ou deploiement pour ce lot.

## Lot 47 : relecture des destinataires de notifications

- Notifications internes et push passent par une relecture commune : intersection entre participants initiaux et actuels, expediteur toujours present/actif, exclusion des conversations masquees/mises en sourdine, comptes desactives et blocages dans les deux sens. Un nouveau membre non destinataire initial ne recoit pas l'apercu. Les push differes rechargent cet etat au moment du callback.
- Huit cas integration supplementaires : retrait/sourdine/masquage/blocage dans les deux sens/desactivation, nouveau membre et expediteur retire avant callback. Les echecs de relecture restent isoles apres commit sans faux echec du message. Requete utilisateurs evitee si aucun destinataire eligible.
- Suite ciblee atomicite/rappels/notifications : 48 tests MongoDB passes ; suite unitaire complete 724 tests / 135 fichiers passee, TypeScript, ESLint et diff-check passes. Notifications et push simules ; aucune preuve de livraison fournisseur.
- Recette complementaire apres optimisation sans destinataire : 53 parcours messaging et les 14 cas notifications repasses (67 tests). Total distinct sur les quatre fichiers executes dans le lot : 101 tests integration, sans compter deux fois les 14 cas rejoues.
- Restent course entre derniere lecture et envoi externe, suppression/lecture du message avant callback, retrait des anciennes notifications deja creees, file durable de reprise et idempotence client. Ce lot reduit les apercus issus d'une liste perimee sans revendiquer une atomicite avec le fournisseur push. Pas de build/deploiement.

## Lot 48 : pas de push differe pour un message lu ou supprime

- Relecture du message par identifiant/conversation/expediteur avant notifications internes et push : absence/suppression globale exclues, suppression pour destinataire et lecture directe ou lastReadAt >= creation excluent seulement ce destinataire. Champs absents des anciens documents traites sans deviner une lecture.
- Sept cas ajoutes : suppression globale, disparition physique, suppression pour un destinataire, lecture message/conversation, lecture ancienne et champs historiques absents. Le push des autres destinataires reste possible. Notifications/push simules, base MongoDB isolee.
- Recette initiale 73 tests integration passes (messaging et notifications), puis 21 tests notifications repasses avec le cas historique ajoute : 74 cas distincts passes au total, sans compter deux fois les cas rejoues. Suite unitaire complete 724 tests / 135 fichiers passee ; ESLint cible et diff-check passent.
- TypeScript final repasse apres ajout du cas historique, sans erreur.
- Restent course entre derniere relecture et envoi externe, modification de contenu avant callback (ancien apercu), suppression des notifications deja stockees, reprise durable et idempotence client. Aucun push deja livre n'est retire par ce lot. Pas de nouveau build/deploiement.

## Lot 49 : apercus reconstruits apres modification du message

- La relecture de message ajoute contenu/type/nom expediteur ; notifications internes et push utilisent cet apercu relu au lieu du texte capture dans la requete initiale. Types non envoyables (dont systeme) exclus de ce chemin. Regroupement des destinataires offline conserve sans perdre les donnees de l'apercu.
- Trois cas integration ajoutes : modification avant callback, modification avant lecture de notification interne, requalification systeme. Verification que l'ancien texte prive n'apparait pas dans le push apres modification. Avec les 53 parcours messaging, 77 tests MongoDB passent sur base isolee, fournisseurs simules.
- TypeScript, ESLint cible et diff-check passes. Aucun message historique modifie par la correction, aucune notification deja livree retiree ; pas de nouveau build/deploiement.
- Suite unitaire complete repassee : 724 tests dans 135 fichiers passes.
- Restent course entre relecture et envoi fournisseur, notifications deja stockees apres edition/suppression, file de reprise/idempotence client et analyse de l'ensemble des parcours de notifications. La lecture fraiche reduit l'exposition du texte perime sans garantir une transaction avec le fournisseur externe.

## Lot 50 : historique de remboursements sans journal technique expose

- Audit des preuves : le parcours refund-proof utilise encore PublicMediaUpload/Cloudinary type upload et accepte une URL externe. Risque de confidentialite non resolu par ce lot : stockage authentifie/prive, lecture autorisee et migration des liens historiques requis. Ne pas considerer une URL non indexee comme privee.
- Correction immediate de listParticipantRefundCases/listOrganizerRefundCases : auditTrail n'expose plus metadata, before/after arbitraires, IP, user-agent ou identifiants techniques. Vue en liste blanche at/action/actorRole ; references et preuves metier restent dans leurs champs dedies. Entrees malformees ignorees sans echec du dossier.
- Aucune reecriture/suppression du journal en base. Trois tests MongoDB verifient minimisation pour client/organisateur, conservation integrale du document original et absence d'acces d'un tiers. Avec destination/declaration : 20 tests integration passes sur base isolee. Trois tests unitaires de projection ajoutes.
- Suite unitaire complete : 727 tests dans 136 fichiers passes.
- TypeScript, ESLint cible et diff-check passes. Reste un acces d'audit technique explicitement habilite a concevoir si necessaire ; ne pas exposer a nouveau toutes les metadonnees via une route de liste. Pas de build/deploiement ou validation juridique.

## Lot 51 : fondation privee des justificatifs de remboursement

- Nouveau stockage RefundProof : original chiffre AES-256-GCM, selection exclue par defaut, liaison chiffree a preuve/dossier/proprietaire. Octets originaux conserves sans transformation ni URL publique. Taille maximale technique de 2 Mio, signatures PNG/JPEG/WebP et MIME coherents ; ce controle ne constitue pas une analyse antivirus ni une verification de la valeur probante.
- Upload HTTP brut borne meme sans Content-Length, authentification et plafond technique de 20 uploads/heure/compte. Ecriture de la preuve et journal dans une transaction conditionnee au proprietaire et au statut individuel to_refund/contested. Aucun fichier de production importe.
- Lecture authentifiee : organisateur proprietaire ; client seulement si la preuve est rattachee a proofs.proofId du dossier. Aucun droit agent implicite. Original telecharge en piece jointe, no-store/nosniff/CSP sandbox ; lecture journalisee. Chiffre corrompu ou substitue refuse. Le nouveau champ proofId reste nullable pour les donnees historiques.
- 19 tests integration MongoDB isole passes (11 nouveaux stockage/acces, 3 historique, 5 declaration). Six tests HTTP ajoutes : session, fichier autorise, refus, taille sans Content-Length, quota, upload. Suite unitaire complete : 733 tests / 137 fichiers passes. TypeScript et ESLint cible passes apres correction du nom de fichier dans un mock.
- IMPORTANT : fondation non encore raccordee aux formulaires ni a la declaration. L'ancien upload public refund-proof et la saisie d'URL sont encore actifs ; la confidentialite de bout en bout n'est PAS acquise. Prochain lot : rattacher atomiquement proofId a la declaration, raccorder web/mobile et lecture native authentifiee, fermer les voies publiques pour nouvelles preuves. Migration des anciens liens/signatures, retention, nettoyage des brouillons et gestion des cles restent ouverts. Aucun build ni deploiement.

## Lot 52 : declaration et consultation des justificatifs prives raccordees

- API de declaration stricte : proofId obligatoire, anciennes URL/proofUpload refusees (y compris en plus du bon champ). Service : controle du proprietaire/dossier, existence et integrite du chiffre dans la transaction ; preuve ajoutee avec son identifiant et URL de lecture authentifiee, original conserve. Une preuve d'un tiers, d'un autre dossier, absente ou corrompue ne modifie pas le remboursement.
- Formulaire web : upload binaire prive lie au dossier, limite 2 Mio, suppression de la saisie URL ; preuve reinitialisee au changement de dossier/fichier, fermeture du dialogue bloquee pendant traitement. Formulaire natif : meme contrat proofId, upload local via le wrapper reseau, aucun telechargement distant comme fichier local. Les fichiers recus sont conserves sans transformation serveur ; preservation du fichier source par le selecteur natif a verifier sur appareils.
- Nouveau lecteur natif commun client/organisateur : requete authentifiee vers la route privee uniquement, image en memoire sans ecriture fichier, nettoyage fermeture/perte de focus/changement de compte/arriere-plan. Les anciens liens HTTPS restent ouvrables sans transmission du cookie ; migration et confidentialite de ces anciens liens NON resolues.
- Signature publique refund-proof refusee aux organisateurs. Audit final : les signatures de retrait cash agents utilisent aussi ce purpose ; exception temporaire limitee activeRole agent conservee pour ne pas casser le parcours existant. Ce chemin doit etre migre en prive avec signature au doigt, code/point et atomicite du retrait ; ne pas affirmer que tout le systeme de preuves/signatures est prive. Les anciens jetons Cloudinary deja emis ne sont pas revoques par le code local.
- 40 tests integration passes sur MongoDB isole (16 preuves, 5 declarations, 7 stock, 12 destinations). Fixtures anciennes converties vers de vrais documents chiffres ; aucune URL publique acceptee comme nouvelle declaration. Douze tests HTTP passent, dont refus URL/upload historiques, transmission proofId et garde de non-regression du chemin agent. Aucun e-mail/paiement reel.
- Suite unitaire web complete finale : 739 tests / 137 fichiers passes, apres la derniere exception de signature agent.
- Controle qualite natif complet passe apres correction d'un fetch local hors wrapper : 173 endpoints visibles / 243 routes web ; 67 ecrans, 18 composants, 10 assets controles statiquement. Six tests natifs supplementaires (upload, limites, erreur, refus distant, declaration et branchements de lecture). Ce ne sont pas des tests sur telephone.
- Build Next 16.3.3 webpack passe, 187 pages statiques, MongoDB de test et cles e-mail/paiement vides. Ce build precede la derniere exception de signature agent, ensuite typecheck/testee. Export Expo Android 1862 modules / iOS 1640 / web 1512 passe dans /tmp/lib-mobile-v1-private-proofs ; bundles Hermes, aucune application signee ou publiee.
- TypeScript web/natif passes ; ESLint cible sans erreur, avertissement setStatus inutilise deja present dans StudioClient ; diff-check des deux depots passe. Restent recette navigateur/appareil, signature agent privee, migration historique, retention/nettoyage des brouillons et cles, livraison coordonnee API/mobile (ancien client organisateur recevra un refus et devra etre mis a jour). Pas de deploiement.

## Lot 53 : retrait cash, caisse et verrouillage transactionnels

- Ecart constate : completeManualRefund cloturait le dossier puis incrementait la caisse hors transaction. Desormais dossier, signature legacy, audit et caisse sont dans la meme transaction MongoDB ; une erreur de caisse annule toutes les ecritures. Montant XOF entier positif exige, aucun montant transmis par le client utilise pour la caisse.
- Point actif attribue a l'agent relu en transaction et touche par refundOperationRevision avant validation ; cette ecriture met en conflit une suppression de mission concurrente et force la relecture des droits. Les deux agents d'un point ne peuvent enregistrer qu'une seule remise pour un code.
- Seuil de cinq essais deja present conserve, compteur/echec/verrouillage enregistres ensemble. Bon code apres verrouillage, code annule, flux individuel, point inactif/non attribue, signature absente et montant invalide refusent la remise. Les codes presentes ne sont pas copies dans le journal.
- Notification cash specifique : remise en especes enregistree au porteur du code, aucun virement ulterieur. Suppression du message promettant l'apparition des fonds sur un moyen de paiement apres un delai. Envoi seulement apres commit ; echec de notification ne transforme pas le retrait en echec rejouable. Reprise durable de cette notification encore ouverte.
- Treize tests MongoDB nouveaux : double agent, echec caisse, retrait de mission entre lecture/ecriture, bascule individuelle concurrente, deux refus de point, dix essais concurrents limites a cinq, quatre refus metier, echec de verrouillage et echec de notification. Ancienne suite agents rendue explicitement sans e-mail externe ; ses criteres historiques de versement restent a requalifier pour V1.
- Incident de recette documente : le premier test de bascule concurrente a expire et bloque trois hooks suivants (49 passes / 4 echecs sur cette execution). Reproduction isolee passee ; attente explicite de RefundCase.init/RefundPoint.init ajoutee avant les transactions pour finir le DDL des index. Nouvelle execution complete : 53 tests / 4 fichiers passes ; aucune operation MongoDB restante lors du controle. Ne pas masquer l'echec initial par un taux agrege.
- Suite unitaire complete : 741 tests / 138 fichiers passes. TypeScript et ESLint cible passes. Aucun build/deploiement ni changement natif dans ce lot.
- Restent prioritaires : stockage prive et vraie capture au doigt de la signature agent, verification du code avant remise physique, reprise reseau de la confirmation, droits/lecture des signatures, migrations historiques. Le web produit deja une signature canvas en data URL mais la route complete la limite a 2000 caracteres ; le natif importe une image publique au lieu d'une capture au doigt. Ces parcours ne sont PAS declares conformes par la seule atomicite serveur.

## Lot 54 : signatures de retrait privees et capture au doigt

- Nouveau contrat de cloture : code + signatureDataUrl PNG ; signatureUrl/signatureUpload historiques refuses par schema strict. Corps JSON borne en lecture meme sans Content-Length (704096 octets), capture limitee a 700000 caracteres et quota technique 30 requetes/minute/agent avant decodage image. Le champ de 2000 caracteres qui bloquait les captures canvas est supprime.
- Sharp 0.35.3, deja present via Next, declare en dependance directe. Tentative offline sans cache echouee puis installation exacte reussie ; aucune montee de version. Validation PNG complete avec plafond de 4 millions de pixels, refus image uniforme/vide/corrompue ; controle d'encre/papier minimal, PAS reconnaissance de signature ni certification d'identite.
- Image originale chiffree AES-GCM dans RefundCase.encryptedSignature (select:false), liee au dossier, point et agent, dans la meme transaction que retrait/caisse/audit. Aucun upload public ni fichier serveur cree. GET /api/refund-signatures/[refundId] authentifie/no-store/nosniff, original telecharge en piece jointe ; acheteur/organisateur du dossier ou agent actuellement attribue au point actif, lecture journalisee. Ancien original conserve, transplantation de chiffre vers un autre dossier refusee.
- Web : canvas existant raccorde au nouveau champ, libelle porteur du code, annulation du geste efface la capture. Natif : import galerie/Cloudinary retire, capture tactile locale WebView sans acces reseau/fichier/cookie, effacement focus/arriere-plan ; variante Expo Web iframe sandbox avec controle de la source des messages. Lecteur prive client/organisateur accepte aussi les signatures via la route authentifiee, sans stockage fichier natif.
- Fin de l'exception provisoire du lot 52 : purpose refund-proof refuse a tous, agents inclus. Les anciennes signatures/URL publiques et jetons Cloudinary deja emis ne sont pas migres ou revoques par cette modification locale. Livraison API + application coordonnee requise : anciens clients agents doivent etre mis a jour.
- 35 tests integration passes (15 retraits/signatures, 17 agents, 3 historique). Neuf tests validation PNG et sept tests routes ajoutes ; suite unitaire complete 757 tests / 140 fichiers passee. TypeScript et ESLint cible passent ; diff-check des deux depots passe.
- Controle qualite mobile complet passe : 173 endpoints visibles, 244 routes web, 67 ecrans/20 composants/10 assets controles statiquement ; quatre tests de capture/transport ajoutes aux six tests de justificatifs. Pas de recette sur appareil.
- Recette Chromium reelle sans serveur/API : trace canvas de 19086 caracteres accepte par le validateur serveur, effacement confirme ; capture inspectee dans /tmp/lib-refund-signature-browser.png. Script scripts/check-refund-signature-browser.ts. Un premier lancement/build a echoue sur l'import @playwright/test inexistant ; corrige vers playwright/test deja utilise par le projet, puis recette et build repasses.
- Build Next 16.3.3 webpack final passe : 187 pages statiques, MongoDB isole et cles e-mail/paiement vides. Export Expo local Android 1868 modules, iOS 1784, web 1341 passe dans /tmp/lib-mobile-v1-private-signatures ; aucune application signee ni publication.
- Restent : verification/reservation du code AVANT remise physique, gestion d'une reponse reseau perdue, historique agent avec lien de lecture, recette tactile iOS/Android et modal web complete, migration des signatures/justificatifs historiques, retention et rotation des cles, reprise durable des notifications. Ni la validite juridique de la signature ni l'exhaustivite R58 ne sont attestees. Aucun deploiement.

## Prochain travail critique

1. Auditer et tester avec une base isolee toutes les voies de creation, approbation, changement d'e-mail et attribution de roles. Les anciennes suites d'integration utilisent encore des comptes clients transformables et des lieux hors Benin : remplacer ces attentes par les regles actuelles, sans affaiblir les tests.
2. Finaliser la recette des rappels en environnement deploye et la presence native. Les regles attente OU accumulation sont maintenant implementees et testees localement ; l'atomicite message/conversation et les seuils definitifs restent a traiter.
3. Auditer les remboursements R58 et le paiement FedaPay de bout en bout, sans utiliser de vraies transactions pour les tests locaux.
   Ecarts reperes non encore corriges : destinations de paiement et notifications de declaration/reception. Le chiffrement est renforce au lot 7, mais l'audit des cles et la migration des donnees historiques restent requis avant deploiement. Le flag avec frais nuls lors d'une nouvelle commande est corrige au lot 5 ; la priorite des causes et la demande transactionnelle sont renforcees au lot 6, sans certifier le paiement FedaPay reel.
4. Finir le perimetre Benin : donnees, devises, filtres, Maps, articles. Les indicatifs telephoniques doivent etre dissocies du catalogue geographique ; `regions` est aujourd'hui limite au Benin et sert aussi aux listes de telephone.
5. Auditer le depot voisin `../LIB_Mobile`, obtenir l'acces d'ecriture si necessaire et verifier la parite native. Les preuves web ne couvrent pas Android/iOS natifs.
6. Executer les recettes applicables, puis traiter deploiement/stores/configurations reelles et arbitrages sans les presenter comme accomplis.

## Environnement de test cree

- MongoDB dedie : `127.0.0.1:27028`, replica set `libv1`, base `liveinblack_v1_test`, donnees dans `/tmp/lib-v1-mongo`, journal `/tmp/lib-v1-mongo.log`. Revalider l'etat du processus avant reutilisation. Aucune base reelle utilisee.
- Serveur Next de test sur port 3001 et navigateur agent-browser session `lib-v1` arretes apres la recette pour permettre le build.
- Le worktree contenait deja de nombreuses modifications : elles ont ete conservees, aucun commit ni reset effectue.

## Points non decidables par du code seul

Migration des anciens comptes multi-profils sans perte, arbitrages cash/OTP/acompte/periode de grace, validation juridique locale, constitution de societe et banque, FedaPay professionnel, Apple/Google et adresse contact operationnelle. Ne pas reduire l'objectif aux modifications deja faites : toutes ces lignes restent ouvertes tant que les preuves manquent.

## Lot 55 : preparation obligatoire du retrait cash avant remise

- Ecart traite : le parcours agent pouvait encore tenter la cloture code + signature en une seule etape. Une reponse reseau perdue ou une erreur apres remise physique restait trop dangereuse pour un remboursement en especes.
- Nouveau verrou applicatif cashOperationId : preparation transactionnelle par code valide, agent et point actif attribue. Le montant XOF renvoye vient du serveur. Une autre operation, un autre agent ou une bascule individuelle concurrente ne peut pas passer tant que la preparation existe.
- Aucune expiration automatique ajoutee : liberer une preparation exige `noCashHanded: true` et journalise `cash_operation_released`. Un identifiant libere ne peut pas etre reutilise. Ce choix evite qu'une preparation expiree rende payable un retrait dont les especes auraient deja ete donnees.
- API agent ajoutee : POST `/prepare`, POST `/release`, et `/complete` exige maintenant `operationId` dans le contrat public. Les corps restent bornes/stricts ; la cloture refuse une operation absente, differente ou reservee par un autre agent.
- Web agent : modale en deux temps. L'agent valide le code avant toute remise, voit le montant confirme par serveur, signe ensuite et finalise avec le meme operationId. Annuler apres validation appelle la liberation ; si elle echoue, la modale reste ouverte avec message d'erreur.
- Mobile agent : meme protocole prepare/complete/release. L'ancien envoi direct est remplace par validation du code, montant confirme, signature locale, puis confirmation. Le service mobile filtre explicitement le payload pour ne transmettre que code, signatureDataUrl et operationId.
- Tests : 19 tests MongoDB cash passent, dont preparation obligatoire, reprise d'une operation preparee/terminee, liberation sans remise, interdiction de resurrection et blocage de bascule individuelle pendant preparation. Les suites agent + cash passent ensemble : 36 tests / 2 fichiers sur MongoDB isole. TypeScript web passe. Qualite mobile complete passe, 175 endpoints visibles / 246 routes web.
- Limites : pas encore de stockage persistant de l'operationId cote client apres redemarrage/app kill, pas de recette navigateur complete avec serveur live, pas de recette tactile iOS/Android physique, pas de migration des anciens dossiers deja partiellement manipules. Aucun deploiement ni paiement/e-mail reel.

## Lot 56 : reprise client des retraits cash prepares

- Web agent : une operation cash preparee est conservee en sessionStorage par dossier avec son code et operationId. A la reouverture de la modale, le client rejoue `/prepare` avec les memes valeurs pour recuperer l'etat serveur et le montant confirme ; si le serveur refuse, la trace locale est effacee et l'agent doit revalider le code avant toute remise.
- Mobile agent : meme reprise via secureStorage, qui utilise SecureStore hors web et sessionStorage sur web. La carte recharge l'operation preparee, demande au serveur si elle reste valide, restaure le montant et bloque la signature/remise sur cette operation. Cloture ou liberation supprime la trace locale.
- La modification de code efface l'operation locale et la signature. La liberation reste explicite avec `noCashHanded: true`; une liberation qui echoue garde l'operation visible au lieu de fermer silencieusement le flux. Cote web, la fermeture par le fond de la modale passe aussi par cette liberation.
- Tests et controles : qualite mobile complete passee, avec 175 endpoints visibles / 246 routes web et 11 tests refund-proofs/signature dont une garde de reprise SecureStore. Web : TypeScript passe, suite unitaire complete 757 tests / 140 fichiers passee. Integration cash/agents relancee : 36 tests / 2 fichiers MongoDB isole passes.
- Build/export : build Next 16.3.3 webpack passe apres les lots 55-56, 187 pages statiques et routes `/prepare`/`/release` visibles. Export Expo local passe pour Android, iOS et web dans `/tmp/lib-mobile-v1-cash-recovery` : Android 1799 modules / 5.1 Mo Hermes, iOS 1790 modules / 4.9 Mo Hermes, web 842 modules / 3 Mo.
- Limites : sessionStorage web ne survit pas a tous les contextes navigateur ; SecureStore aide au redemarrage mobile mais pas a une desinstallation ni a un changement de compte mal synchronise. Pas de recette appareil physique ni de test navigateur live du parcours complet. Aucun deploiement ni publication store.

## Lot 57 : revente fermee en dur pour la V1

- Ecart traite : malgre des corrections precedentes, les routes `/api/tickets/resell`, `/api/resale-listings/[id]`, `/api/events/[eventId]/resale-listings`, `/api/checkout/resale` et `/api/checkout/resale/fedapay` pouvaient encore redevenir actives si un ancien flag d'exploitation etait active.
- Fermeture API inconditionnelle : ces endpoints retournent maintenant `410` avec `resale_disabled_v1`, sans auth, sans lecture de body, sans appel Stripe/FedaPay et sans service de revente. La route publique renvoie aussi `listings: []`.
- Surface produit : la section evenement `ResaleListingsSection` ne fetch plus et retourne `null`. Le wallet ticket projette toujours `resellable: false` et `activeListing: null`, meme si un ancien listing existe en base ou si le flag historique remonte `true`.
- Ops : le preset "Tout retablir" du panneau Vercel ne tente plus de reactiver la revente ; il remet maintenance/paiements en mode V1 tout en gardant `ticketResaleEnabled: false`. Le PATCH agent refusait deja `ticketResaleEnabled: true`.
- Recette : la seeded E2E historique "client can list and withdraw" devient une preuve de refus V1 pour mise en vente et achat de revente. Nouveau test unitaire web : cinq endpoints revente refusent en 410 et la projection wallet n'expose pas l'ancien listing.
- Tests et controles : TypeScript web passe ; test cible revente 6/6 passe ; suite unitaire complete 763 tests / 141 fichiers passe ; qualite mobile complete passe, le check QA mobile attend maintenant le refus dur `resale_disabled_v1`; build Next 16.3.3 webpack passe, 187 pages statiques.
- Limites : les routes restent visibles dans la table Next pour compatibilite/refus explicite, et le code service historique de revente reste en depot comme archive technique inactive. Aucune migration/suppression des anciennes donnees de listing en base n'a ete effectuee. Aucun deploiement.

## Lot 58 : cron et configuration revente neutralises

- Ecart traite : le cron Vercel `/api/cron/resale-expiry` restait planifie toutes les 15 minutes et appelait encore le service historique de revente, alors que la V1 exclut la revente.
- `vercel.json` ne planifie plus `resale-expiry`. La route existe encore comme ancien point d'entree compatible, mais retourne `410 resale_disabled_v1` avec `expired: 0`, sans wrapper cron, sans lecture de listing et sans notification.
- Le setup Edge Config initialise maintenant `ticket_resale_enabled` a `false`. Le script d'audit workflows ne recommande plus de migrer `resale-expiry` comme premiere action ; il indique de le maintenir hors V1.
- Le test unitaire revente V1 couvre aussi l'ancienne route cron : 7 routes/projections refusees ou neutralisees. Les tests historiques actifs de revente ne sont plus la reference V1.
- Tests et controles : TypeScript web passe ; test cible revente 7/7 passe ; suite unitaire complete 764 tests / 141 fichiers passe ; qualite mobile complete passe ; build Next 16.3.3 webpack passe avec 187 pages statiques. Le cron reste visible comme route Next mais absent du planning Vercel.
- Limites : code service historique et quelques tests integration anciens restent dans le depot pour memoire/migration ; ils ne doivent pas etre utilises comme critere V1. Aucun deploiement ni nettoyage des donnees historiques.

## Lot 59 : recettes historiques de revente sorties du critere V1

- Ecart traite : `resale.integration.test.ts` continuait a prouver l'ancien fonctionnement actif de la bourse de revente. Il est maintenant explicitement marque historique et skippe ; la preuve V1 est `resaleDisabledV1.test.ts`.
- Le test de cycle evenement ne fabrique plus une revente via `listTicketForResale`/`initiateResaleOrder`/`fulfillResaleOrder`. Le cas conserve teste seulement une commande historiquement remplacee : ancienne commande `superseded`, commande remplacante `paid` en XOF, puis annulation R58 qui cree un seul dossier pour le dernier payeur.
- Correction du jeu de donnees de ce test : montants XOF, rail FedaPay, acheteurs avec identifiants Mongo valides. Cela evite les faux echecs d'e-mail et l'ancien melange EUR/revente.
- Tests et controles : integration evenement + fichier revente historique : 16 tests passes, 13 skips documentes ; TypeScript web passe ; suite unitaire complete 764 tests / 141 fichiers passe ; qualite mobile complete passe ; build Next 16.3.3 webpack passe avec 187 pages statiques.
- Limites : le code service de revente et ses tests historiques restent dans le depot pour memoire technique. Ils sont volontairement exclus de la conformite V1 et ne doivent pas servir de base pour reintroduire des routes ou UI actives. Aucun deploiement ni migration de donnees historiques.

## Lot 60 : catalogue e-mails actif sans revente et exemples Benin

- Ecart traite : le catalogue et l'aperçu graphiques des e-mails listaient encore quatre scenarios de revente actifs, malgre l'exclusion V1. Le groupe "Remboursements & revente" est remplace par "Remboursements".
- Les scenarios actifs passent de 58 a 54 : "Billet transfere", "Revente creee", "Revente vendue" et "Revente expiree" ne sont plus generes par `scripts/generate-email-preview.ts` ni presents dans `docs/design/EMAIL_CATALOG.md` / `docs/design/emails-preview.html`.
- Les exemples encore actifs du catalogue sont relocalises au Benin : evenement "Cotonou Night Live", lieu "Palais des Congres de Cotonou", ville "Cotonou", connexion "Cotonou, Benin", montants deja en FCFA. La vente cash en attente utilise aussi cet evenement au lieu de l'ancien libelle "Moonlight Experience".
- Textes de versement nettoyes : le template de versement initie ne promet plus un delai automatique ("Il devrait arriver sous..."), mais affiche un suivi FedaPay. L'aperçu d'impact d'annulation ne parle plus de deduction sur un prochain versement ; il rappelle que les dossiers sont suivis dans LIB et finances/effectues par l'organisateur.
- Le template historique de revente est marque comme tel et sa phrase de versement post-evenement est neutralisee. Il reste exclu du catalogue actif.
- Verifications ciblees : aucune occurrence active de `Moonlight Experience`, `Palais de Lome`, `Lome, Togo`, `Remboursements & revente`, `Revente creee`, `Revente vendue`, `Revente expiree` dans le generateur et les deux fichiers generes ; aucune reference aux fonctions `resaleListing*Email` / `ticketInvalidatedByResaleEmail` dans ces trois fichiers. Aucune occurrence de `J+5`, `2 a 3`, `prochain versement`, `apres evenement`, `Il devrait arriver` ou `Le versement arrive` dans les templates e-mails, le generateur et les aperçus actifs.
- Controle technique : regeneration du catalogue passee avec `node --import tsx scripts/generate-email-preview.ts` ; TypeScript web passe.
- Limites : les templates historiques de revente restent dans `lib/server/emails/templates/resale.ts` tant que le code historique de revente n'est pas supprime/migre. Ce lot retire leur exposition du catalogue actif ; il ne prouve pas l'audit de tous les anciens documents ni un deploiement.

## Lot 61 : Stripe Connect organisateur ferme et boosts sortis de l'euro

- Ecart traite : l'espace organisateur pouvait encore deriver un mode Stripe Connect depuis d'anciens champs utilisateur, exposer une demande de reversement manuel et afficher les boosts en euros avec redirection Stripe.
- Les routes organisateur `/api/organizers/me/payouts/connect` et `/api/organizers/me/payouts/request` restent protegees par auth/role mais retournent maintenant respectivement `410 stripe_connect_disabled_v1` et `410 manual_payout_request_disabled_v1`. Les fonctions serveur equivalentes retournent les memes refus sans appel Stripe, sans creation de compte Connect et sans creation de `PayoutRequest`.
- Le statut d'encaissement organisateur ignore les champs historiques `stripeAccountId` / `stripeChargesEnabled` : mode `none`, `connected:false`, `chargesEnabled:false`. Le panneau affiche FedaPay Marketplace Benin, le solde XOF comme suivi historique interne, et ne propose plus le bouton "Demander un reversement".
- Le defaut monetaire partage passe a XOF/FCFA : region inconnue ou evenement sans `currency` explicite ne retombe plus en EUR. Une devise explicitement `EUR` reste EUR pour eviter une conversion silencieuse d'historique financier.
- Les alertes d'encaissement organisateur ne demandent plus de compte bancaire pour des evenements EUR historiques. Elles signalent seulement les manques Mobile Money/FedaPay actionnables.
- Les informations legales centrales utilisent `contact@liveinblack.com` et retirent Stripe des sous-traitants actifs de paiement/reversement V1 ; FedaPay reste le prestataire de paiement FCFA.
- Le bareme boost serveur est remplace par le bareme FCFA de la synthese : Top 1, Top 2, Top 3 de 1 a 7 jours, sans offre mensuelle. L'UI affiche FCFA et "Paiement securise via FedaPay".
- Pour eviter un paiement faux, l'ancien checkout boost Stripe/EUR est ferme : `POST /api/checkout/boost` valide l'offre et la propriete, reserve puis libere le slot, puis retourne `501 fedapay_boost_checkout_required_v1`. Le retour historique Stripe boost retourne `410 stripe_boost_return_disabled_v1`.
- Tests et controles : TypeScript web passe ; suite unitaire complete passee avant changement boost puis tests cibles boost/devise/gaps/payout utils : 21 tests / 4 fichiers passent ; integration MongoDB `organizerPayouts` passe 6 tests. Recherche ciblee : plus de CTA "Demander un reversement", plus de libelle FadaPay, plus de texte actif "Paiement securise via Stripe" dans les surfaces organisateur/boost auditees.
- Limites : le paiement boost FedaPay complet n'est pas encore cable ; ce lot supprime l'ancien paiement Stripe actif et aligne tarifs/UI. Des webhooks/routes Stripe historiques existent encore pour anciens flux ou autres modules et doivent etre audites separement avant production. Aucun deploiement.

## Lot 62 : checkout boost FedaPay FCFA cable

- Suite du lot 61 : le paiement boost ne reste plus en `501`. `POST /api/checkout/boost` cree maintenant une transaction FedaPay XOF avec montant issu du barème serveur, callback `/boost-active`, metadata `intent:boost` et reference `boostId`. En local sans cle FedaPay hors production, il simule un paiement approuve comme le checkout billet FedaPay.
- Le verrou `BoostSlot` porte maintenant `days`, `price` et `fedapayTxnId`. Cela donne au webhook un registre serveur fiable pour retrouver le boost sans faire confiance aux metadata brutes du prestataire.
- Le modele `Boost` stocke aussi `fedapayTxnId`. La finalisation `finalizeFedapayBoost` active le boost, passe le slot en `active`, conserve le prix FCFA, notifie l'organisateur et reste idempotente sur les retries webhook.
- Le webhook FedaPay route maintenant les transactions approuvees vers abonnement prestataire, puis boost, puis commandes. En cas d'annulation/refus FedaPay d'un boost encore pending, le slot est libere.
- La page `/boost-active` accepte `id` FedaPay ou `session_id` legacy comme identifiant de transaction, relit le statut via `/api/checkout/boost`, puis affiche l'etat. Le message support utilise `contact@liveinblack.com`.
- Tests ajoutes : `boostSlots.integration.test.ts` contient une preuve MongoDB de finalisation FedaPay boost, prix 20 000 FCFA, slot actif et idempotence. Les fixtures de cette suite sont relocalisees a Cotonou/Benin.
- Tests et controles executes : TypeScript web passe ; test unitaire boost 7/7 passe ; suite unitaire complete web 764 tests / 141 fichiers passe ; build Next 16.3.3 webpack passe avec 187 pages statiques. Recherches ciblees : plus de prix boost historiques euro/mensuels dans `boosts.ts`, tests boost et `BoostModal`.
- Limite de preuve : l'integration MongoDB boost FedaPay a ete ajoutee mais sa relance a ete refusee par le validateur d'approbation automatique lors de ce tour. Elle doit etre executee des que l'acces au Mongo local de test est autorise. Aucun vrai paiement FedaPay sandbox, aucun webhook externe et aucun deploiement n'ont ete verifies.

## Lot 63 : checkout Stripe public et solde de blocage fermes

- Ecart traite : le checkout public generique `/api/checkout` pouvait encore creer des sessions Stripe/EUR pour les billets payants, et le paiement du solde d'une place bloquee pouvait encore choisir l'ancien endpoint Stripe selon la devise du hold.
- Le panneau d'achat evenement envoie maintenant tous les paniers payants vers `/api/checkout/fedapay`. L'ancien message d'erreur Stripe indique clairement que la billetterie de lancement passe uniquement par FedaPay en FCFA.
- `POST /api/checkout` reste authentifie et valide le corps, mais retourne toujours `410 stripe_checkout_disabled_v1` sans creation d'Order, sans appel Stripe et sans rail EUR actif. `GET /api/checkout` reste disponible uniquement pour relire un ancien retour Stripe historique ou le rail gratuit `order_id`, avec controle de proprietaire.
- `POST /api/seat-holds` et `POST /api/checkout/seat-hold` retournent maintenant `410 stripe_seat_hold_disabled_v1`. Le wallet client paie le solde de blocage uniquement via `/api/checkout/seat-hold/fedapay`.
- Le webhook Stripe verifie encore la signature quand le secret existe, mais n'execute plus aucune finalisation billet, boost, abonnement, place bloquee ou revente en V1. Il repond `ignored: stripe_disabled_v1` apres validation.
- Les pages de retour paiement ne presentent plus Stripe comme flux actif ; elles gardent seulement la relecture d'anciens retours historiques. Les adresses support visibles sur succes paiement et boost utilisent `contact@liveinblack.com`.
- Tests et controles : TypeScript web passe ; suite unitaire complete web 764 tests / 141 fichiers passe ; build Next 16.3.3 webpack passe avec 187 pages statiques.
- Limites : les routes Stripe restent visibles dans la table Next pour compatibilite/refus explicite. Les abonnements prestataires Stripe et certains commentaires/docs historiques restent a auditer dans les lots suivants. Aucun paiement FedaPay sandbox, webhook externe, recette navigateur live ni deploiement n'ont ete verifies.

## Lot 64 : abonnement prestataire Stripe ferme, FedaPay force

- Ecart traite : l'abonnement prestataire exposait encore `/api/subscriptions/checkout` comme rail Stripe/EUR actif et l'interface `/offer-services` tentait ce rail lorsque le contexte de facturation etait EUR.
- `POST /api/subscriptions/checkout` et `GET /api/subscriptions/checkout?session_id=...` restent proteges par auth/role prestataire, mais retournent maintenant `410 stripe_subscription_disabled_v1`. Ils ne creent plus de session Stripe et ne confirment plus d'abonnement depuis un ancien retour Checkout.
- Les fonctions serveur Stripe prestataire `createStripeSubscriptionCheckout`, `confirmStripeSubscriptionCheckout`, `handleStripeSubscriptionCheckoutCompleted`, `handleStripeSubscriptionEvent` et `handleStripeSubscriptionInvoicePaid` sont neutralisees pour la V1 : refus ou no-op, sans activation/mirroring ni enregistrement de paiement Stripe.
- Le contexte de facturation prestataire actif est force sur `benin` / `XOF`, meme si un ancien utilisateur porte une region historique. La normalisation des anciennes regions reste disponible pour lire l'historique, pas pour router un paiement V1.
- Le panneau abonnement prestataire affiche uniquement le tarif `9 000 FCFA / 30 j`, le paiement Mobile Money / carte via FedaPay, et le renouvellement manuel. Le bouton appelle toujours `/api/subscriptions/checkout/fedapay`.
- L'inscription prestataire n'affiche plus de fallback `9,99 € / mois · carte bancaire`; le texte final annonce le prix FCFA via FedaPay.
- Les tests unitaires de facturation prestataire attendent maintenant Benin/XOF meme avec des entrees historiques Togo/Senegal. Les tests d'integration providerSubscriptions sont requalifies : Stripe doit refuser/no-op, FedaPay doit accepter la V1 Benin.
- Tests et controles : TypeScript web passe ; suite unitaire complete web 764 tests / 141 fichiers passe ; recherche ciblee sans `stripe.checkout.sessions.create`, `9,99` ou `Carte bancaire (Stripe)` actifs dans `app`/`lib`.
- Limites : l'integration MongoDB `providerSubscriptions.integration.test.ts` a ete adaptee mais non relancee dans ce tour, car l'acces Mongo local avait ete refuse par le validateur automatique au tour precedent. La resiliation d'un ancien abonnement Stripe lors d'une suppression de compte reste un cas de securite historique a arbitrer pour eviter une facturation externe residuelle. Aucun paiement FedaPay sandbox ni deploiement verifies.

## Lot 65 : suppression de compte et anciens abonnements externes securises

- Suite du lot 64 : la V1 ne cree plus d'abonnement Stripe, mais un ancien abonnement externe peut encore exister. Lors d'une suppression de compte agent, ce cas reste traite en fail-closed pour eviter de laisser une facturation hors plateforme apres anonymisation.
- `cancelProviderSubscriptionForDeletion` conserve l'appel d'annulation Stripe uniquement pour un ancien `prestataireSubRail:'stripe'` avec `stripeSubscriptionId`, puis nettoie maintenant aussi `prestataireSubEnd`, `prestataireSubRail`, `stripeSubscriptionId` et `stripeCustomerId`.
- L'anonymisation agent purge egalement ces champs prestataire/Stripe en plus de `stripeAccountId`, `stripeChargesEnabled` et `providerBillingRegionId`. Un compte supprime ne garde donc plus d'identifiants externes ni de rail abonnement actif.
- Le libelle d'audit agent distingue maintenant "ancien Stripe externe" de "FedaPay" et annonce une desactivation a l'approbation, sans presenter Stripe comme une option V1.
- Test d'integration existant mis a jour : apres suppression d'un ancien compte prestataire Stripe, les champs `prestataireSubRail`, `stripeSubscriptionId` et `stripeCustomerId` doivent etre `null`.
- Tests et controles : TypeScript web passe ; suite unitaire complete web 764 tests / 141 fichiers passe.
- Limites : la preuve MongoDB de cette branche reste a relancer quand l'acces Mongo local de test sera autorise. Aucun appel reel Stripe ni verification de portail externe n'a ete effectue ; ce lot protege la purge applicative et le contrat de code.

## Lot 66 : fallbacks EUR restants retires des paiements actifs

- Ecart traite : certains chemins actifs retombaient encore en EUR quand `event.currency` etait absent ou different de XOF, notamment blocages de place, vente agent, creation d'order et previsualisation de code promo.
- Blocage de place : `createSeatHold` refuse maintenant le rail Stripe avec `410 stripe_seat_hold_disabled_v1`, traite l'absence de devise comme XOF, et refuse une devise explicite non-XOF avec `xof_required_v1`. La completion de solde refuse aussi le rail Stripe avant toute lecture metier.
- Vente agent : le calcul de devise passe en fail-safe XOF pour les anciens evenements sans devise, mais refuse l'EUR explicite avec `xof_required_v1`. Les ventes cash/Mobile Money ne peuvent donc plus produire une commande EUR active.
- Creation d'order billet : meme logique, absence de devise = XOF, devise explicite EUR = refus `benin_xof_launch_scope_required`, sans conversion silencieuse.
- Preview code promo : un evenement EUR explicite est refuse avant calcul de reduction et label, pour ne plus afficher un symbole euro utilisable sur un parcours V1.
- Checkout FedaPay billet : le precheck ne bloque plus les anciens evenements sans champ `currency`; il refuse seulement `EUR` explicite et laisse `createOrder` appliquer le garde-fou serveur.
- Tests et controles : TypeScript web passe ; suite unitaire complete web 764 tests / 141 fichiers passe ; recherche ciblee sans fallback actif `event.currency || 'EUR'`, `event.currency === 'XOF' ? 'XOF' : 'EUR'` ni `event.currency !== 'XOF'` dans `app`/`lib`, hors service historique de revente deja ferme en V1.
- Limites : les tests d'integration Mongo des ventes agent, orders, promos et seat-holds n'ont pas ete relances faute d'acces Mongo local autorise. Le service historique de revente conserve un fallback EUR dans du code archive/inactif ; les routes de revente restent fermees en 410 depuis les lots 57-58.

## Lot 67 : creation et edition d'evenements forcees Benin/XOF

- Ecart traite : le wizard organisateur pouvait encore rehydrater une region etrangere depuis un ancien evenement, et les tests du wizard utilisaient Paris/IDF comme exemple positif.
- Le wizard organisateur n'utilise plus `regionToCurrency(region)` pour determiner la devise active : la devise de creation/edition est forcee a `XOF`. Les prix et menus affichent donc FCFA pendant le lancement.
- Au chargement d'un ancien evenement, une region non-Benin n'est plus reappliquee dans l'etat du formulaire : elle est remplacee par la region de lancement `Bénin`.
- `validateWizardLocation` refuse maintenant toute region autre que Benin/Bénin avec le message du lancement. Le test unitaire ajoute verifie que Paris/IDF est bloque, tandis que l'exemple de payload positif passe a Cotonou/Bénin.
- Cote serveur, `updateOrganizerEvent` normalise un ancien evenement non vendu hors Benin vers `Bénin` et `XOF` lors d'une mutation non verrouillee, tout en continuant a refuser explicitement une region envoyee hors Benin avec `benin_launch_region_required`.
- La creation serveur refusait deja les regions hors Benin et derive XOF depuis la region `Bénin`; ce lot ferme surtout la rehydratation UI et la mise a jour d'anciens brouillons/evenements non vendus.
- Tests et controles : test cible `eventWizardUtils` 5/5 passe ; TypeScript web passe ; suite unitaire complete web 764 tests / 141 fichiers passe.
- Limites : l'integration Mongo `organizerEvents.integration.test.ts` contient deja des cas de refus hors Benin mais n'a pas ete relancee faute d'acces Mongo local autorise. Les anciens evenements verrouilles avec ventes ne sont pas modifies silencieusement ; ils restent a traiter par migration/audit financier.

## Lot 68 : seeds et contenus demo relocalises Benin/FCFA

- Ecart traite : certains scripts de donnees de demonstration et de recette pouvaient encore reintroduire des donnees Togo/Lome/+228 ou des prix de boost `9.99`, ce qui entretenait l'ecart signale par Chady entre le lancement Benin et les contenus affiches.
- Le seed E2E remplace les utilisateurs, numeros, profils, candidatures, lieux, evenements, tickets, messages, ventes cash et boosts de Lome/Togo/+228 vers Cotonou/Benin/+229. Les zones d'intervention demo restent limitees a `benin`.
- Les references de paiement demo E2E sont adaptees au lancement : `payoutMomos` passe sur la cle Benin, une reference de sous-compte FedaPay demo est presente, les achats Mobile Money indiquent `BJ`, et le boost actif utilise `region:'benin'` avec un prix FCFA.
- Les seeds dev et bulk ne creent plus de boosts `9.99` : le prix de demonstration passe a `30000`, coherent avec le bareme Top 1 / 7 jours FCFA.
- Le seed blog historique ne publie plus le slug ni le contenu `togo`/`Lome` : l'article est relocalise a Cotonou/Benin, avec vocabulaire cotonois/beninois.
- Un texte de candidature prestataire demo `cuisine togolaise` est remplace par `cuisine beninoise`.
- Tests et controles : recherche ciblee propre sur `+228`, `Togo`, `togo`, `Lome`, `Lomé`, `Paris`, `Lyon`, `France`, `Dakar`, `Abidjan`, `EUR`, `€`, `9.99`, `TG` et `AFRO NATION LOM` dans les seeds audites ; TypeScript web passe ; suite unitaire complete web 764 tests / 141 fichiers passe ; build Next 16.3.3 webpack passe avec 187 pages statiques.
- Limites : les scripts de seed n'ont pas ete executes contre MongoDB dans ce lot, faute d'acces Mongo local autorise precedemment. Ce lot nettoie les donnees sources de demo/recette ; il ne migre pas une base de production deja peuplee et ne certifie pas les anciens enregistrements existants.

## Lot 69 : exposition UI revente retiree des surfaces client/organisateur

- Ecart traite : meme avec les routes de revente fermees en `410`, la fiche evenement montait encore une section publique de listings, le wallet client conservait les boutons/modales de mise en vente et retrait, et les statistiques organisateur pouvaient afficher un bloc "Revente officielle" si des donnees historiques existaient.
- La fiche evenement ne monte plus `ResaleListingsSection`. Aucun appel client inutile vers `/api/events/[eventId]/resale-listings` n'est declenche depuis cette surface V1.
- Le wallet client ne propose plus "Revendre", ne garde plus le formulaire de prix de revente, ne permet plus le retrait d'une annonce historique et ne contient plus les handlers client appelant `/api/tickets/resell` ou `/api/resale-listings/[id]`.
- Le dernier message d'erreur remboursement lie a un ticket historiquement liste est rendu neutre pour ne pas presenter la revente comme un parcours utilisable par le client.
- Les statistiques organisateur ne rendent plus le bloc "Revente officielle", meme si des `resaleStats` historiques non nuls existent. Les donnees peuvent rester consultables par audit technique/base, mais ne sont plus exposees comme fonctionnalite produit V1.
- Tests et controles : recherche ciblee propre sur `ResaleListingsSection`, `Revendre`, `marche de revente`, `Revente officielle`, `Prix de revente`, `Mise en vente`, `RESELL_ERROR_LABELS`, `handleResell`, `handleWithdrawResell` et `resellOpen` dans les trois surfaces auditees ; TypeScript web passe ; test unitaire `resaleDisabledV1` 7/7 passe.
- Limites : les modeles, services et templates historiques de revente restent dans le code pour compatibilite/audit et parce que les endpoints V1 les refusent deja. Ce lot retire l'exposition UI active ; une suppression physique complete de l'ancien module devra etre planifiee separement si souhaitee.

## Lot 70 : centre ops aligne sur la revente exclue V1

- Ecart traite : le centre Vercel & Site considerait encore `ticketResaleEnabled:false` comme un fonctionnement partiel et decrivait le mode normal comme permettant aux visiteurs de revendre leurs billets.
- Le statut global du site ne classe plus la revente desactivee comme une anomalie : si la maintenance est coupee et la billetterie ouverte, l'etat affiche "Site V1 Operationnel".
- Les textes d'actions rapides ne mentionnent plus les achats Stripe ni la suspension de la revente comme une fonctionnalite live. Le mode normal annonce les achats FedaPay autorises et la revente exclue du lancement Benin.
- L'interrupteur ops est renomme "Revente de billets", force visuellement inactif et decrit comme verrouille parce qu'exclu de la V1 Benin. Il ne peut toujours pas etre active depuis l'API, qui retourne `409 ticket_resale_v1_disabled` si `ticketResaleEnabled:true` est envoye.
- Tests et controles : TypeScript web passe ; recherche ciblee sans "revendre leurs billets", "achats Stripe", "Bourse de revente officielle" ni "revente desactivee" dans les surfaces ops auditees. Les occurrences restantes de `ticketResaleEnabled` correspondent au schema/config/verrou serveur ou aux presets qui forcent `false`.
- Limites : la cle Edge Config historique reste lue pour compatibilite et pour forcer la valeur a `false` via les presets. Ce lot ne supprime pas la route ni la cle de configuration, afin d'eviter une migration ops risquee sans besoin produit.

## Lot 71 : dashboard agent et boosts affiches en FCFA

- Ecart traite : les panneaux agent affichaient encore les revenus boosts, le revenu plateforme et le volume commercial en EUR, et certains textes de conflit boost renvoyaient vers Stripe.
- Le dashboard serveur separe maintenant explicitement le revenu historique EUR du revenu V1 XOF : les boosts FCFA ne sont plus additionnes au champ `platformRevenueEUR`. Un champ `platformRevenueXOF` additionne les frais de billetterie XOF et les boosts FCFA.
- Le dashboard agent utilise `platformRevenueXOF`, `ticketFeeRevenueXOF`, `gmvTicketsXOF` et les boosts en `XOF` pour les cartes visibles "Controle financier", "Revenu plateforme" et "Volume commercial". Les lignes "Historique EUR" ne sont plus rendues dans l'interface.
- Le panneau agent Boosts affiche le revenu total et chaque boost en FCFA. Les messages de conflit parlent de verification FedaPay/support et ne demandent plus d'aller verifier/rembourser dans Stripe.
- Les fixtures positives d'integration Boosts sont relocalisees a Cotonou/Benin et utilisent le bareme FCFA, au lieu de Paris/france/9.99.
- Tests et controles : TypeScript web passe ; recherche ciblee propre sur `fmtMoney(..., 'EUR')`, `Stripe`, `€`, `9.99`, `9,99`, `Paris`, `france`, `togo`, `Togo`, `Lome`, `Lomé` dans `AgentBoostsClient`, `AgentDashboardClient` et l'integration Boosts ; suite unitaire complete web 764 tests / 141 fichiers passe ; build Next 16.3.3 webpack passe avec 187 pages statiques.
- Limites : les integrations `agentDashboard.integration.test.ts` et `agentBoosts.integration.test.ts` sont modifiees mais non executees en vraie base dans ce lot. Une tentative via la commande unitaire a confirme qu'elles sont exclues par la configuration globale des tests d'integration ; l'acces Mongo local reste a relancer dans un cadre autorise.

## Lot 72 : panneau paiements agent sans actions ni libelles EUR/Stripe visibles

- Ecart traite : le panneau agent paiements exposait encore les files "Demandes de virement" EUR, les soldes EUR, les confirmations de reversement EUR et des consignes "verifier dans Stripe ou FedaPay".
- L'interface V1 ne rend plus la file de demandes de virement historiques ni les actions de reglement EUR. Les soldes hors perimetre restent dans les donnees serveur pour migration/audit, mais ne sont plus presentes comme actions de lancement.
- Le compteur de l'onglet reversements ne compte plus les demandes/soldes EUR historiques ; il compte les echecs de versement XOF et les soldes XOF sans demande.
- Les cartes "Soldes dus sans demande" deviennent "Soldes XOF dus sans demande" et n'affichent plus de ligne "Solde EUR".
- La branche de confirmation `settle` et le formatteur `fmtEUR` sont retires du composant client. La fermeture a zero d'une demande utilise un payload XOF neutre au lieu de forcer `currency:'EUR'`.
- Les alertes paiement ne demandent plus de verifier "Stripe ou FedaPay" ; les textes visibles parlent de FedaPay ou dossier de preuve. Le libelle `stripe_refund_failed` est reformule en "Remboursement carte historique a verifier".
- Tests et controles : recherche ciblee propre sur `EUR`, `Stripe`, `€`, `fmtEUR`, `payCents`, `type === 'settle'` et `currency:'EUR'` dans `AgentPaymentsClient` ; TypeScript web passe ; suite unitaire complete web 764 tests / 141 fichiers passe ; build Next 16.3.3 webpack passe avec 187 pages statiques.
- Limites : la route serveur historique `/api/agent/payments/payouts/settle` et le service `markSellerBalancePaid` restent presents pour compatibilite/audit. Ce lot retire l'exposition agent V1, pas la migration physique des anciens soldes ledger.

## Lot 73 : annuaires publics sans selecteur multi-region

- Ecart traite : les pages publiques organisateurs et prestataires affichaient encore un filtre "Toutes les regions" construit depuis la liste de regions, alors que le lancement est limite au Benin et que Chady a demande de retirer les pays/regions internationaux.
- `/organizers` n'importe plus `regions` pour construire le selecteur. Le champ visible devient un perimetre verrouille "Benin uniquement".
- `/providers` applique le meme verrou visible "Benin uniquement" au lieu d'un choix multi-region.
- Les parametres d'URL `region` sont normalises : seule la valeur Benin est acceptee comme filtre explicite ; une region etrangere dans l'URL est ignoree et ne cree pas un etat d'interface France/Togo/etc.
- Les liens de pagination/categories ne propagent plus une region etrangere, puisqu'ils reutilisent la region normalisee.
- Les textes d'etat vide ne proposent plus "elargir la region" ou "une autre region" ; ils invitent a chercher dans le catalogue Benin.
- Tests et controles : TypeScript web passe ; recherche ciblee propre sur `Toutes les regions`, `Elargissez la region`, `autre region`, `regions.map`, import de `regions` et `getRegionName(region)` dans les deux pages ; suite unitaire complete web 764 tests / 141 fichiers passe ; build Next 16.3.3 webpack passe avec 187 pages statiques.
- Limites : ce lot corrige les annuaires web publics. Les autres surfaces qui utilisent encore `regions` pour un contexte ferme Benin/prestataire/organisateur doivent rester auditees une par une afin de distinguer un selecteur visible interdit d'un mapping historique interne.

## Lot 74 : categories blog limitees au lancement Benin

- Ecart traite : le blog public et l'admin blog exposaient encore des categories pays historiques (`Togo`, `France`, Cote d'Ivoire, Senegal, etc.) alors que le lancement editorial est centre Benin.
- Le modele `BlogPost` limite maintenant les categories creatables/modifiables a `benin`, `guide` et `actualite`.
- L'admin blog ne propose plus que `Actualite`, `Guide` et `Benin` dans les filtres et formulaires.
- La page `/blog` ne construit plus ses libelles depuis `regions` et ne rend plus de liens de categorie internationaux. Une categorie inconnue ou historique dans l'URL est ignoree et retombe sur tous les articles.
- La page article `/blog/[slug]` affiche les libelles de categorie V1 sans importer la liste de regions.
- Tests et controles : TypeScript web passe ; recherche ciblee propre sur les anciennes categories internationales et `regions.map` dans `BlogPost`, `AgentBlogClient`, `/blog` et `/blog/[slug]` ; suite unitaire complete web 764 tests / 141 fichiers passe ; build Next 16.3.3 webpack passe avec 187 pages statiques.
- Limites : les anciens articles deja en base avec une categorie historique restent lisibles par slug si publies ; ce lot empeche leur creation/edition dans les categories internationales et retire ces categories de la navigation V1. Une migration de donnees existantes devra recategoriser ou depublier ces anciens articles si la base en contient.

## Lot 75 : dossiers prestataires simplifies et justificatifs V1 verrouilles

- Ecart traite : l'inscription prestataire ne montrait plus l'etape tarifaire principale, mais la page documents demandait encore des pieces optionnelles/conditionnelles et le serveur pouvait exiger des justificatifs entreprise selon la categorie. Le panneau agent affichait aussi encore SIRET et tarifs historiques, dont une fourchette en euros.
- `getRequiredDocs` retourne maintenant uniquement `identity` pour les organisateurs et les prestataires, quelle que soit la categorie choisie. Les pieces eventuelles demandees par FedaPay ou par un controle juridique restent hors formulaire LIB V1.
- Le wizard prestataire affiche le libelle exact "Piece d'identite du titulaire du compte" et explique que seule cette piece est demandee par LIVEINBLACK. Les uploads optionnels assurance RC Pro et licence/debit de boissons sont retires du formulaire.
- Les routes API de soumission/inscription prestataire ne declarent plus `siret` dans leur schema d'entree ; une soumission manuelle ne peut donc plus ajouter cet identifiant via ce champ.
- Le panneau agent Dossiers ne rend plus les lignes SIRET organisateur/prestataire et ne rend plus le bloc Tarifs prestataire. Les documents historiques eventuellement stockes sont etiquetes comme historiques hors formulaire V1, sans KBIS/RCCM/IFU/licence active.
- Les tests d'integration modifies alignent les fixtures positives sur Cotonou/Benin/+229 et ne valident plus un formulaire via SIRET/Lome/Togo. Les tests unitaires couvrent maintenant la regle identity uniquement pour prestataire multi-categories.
- Tests et controles : recherche ciblee propre sur `SIRET`, `SIREN`, `IFU`, `RCCM`, `KBIS`, `Licence / justificatif`, `Fourchette`, `€`, `Tarifs`, `isValidSiret` et `formatSiret` dans les surfaces d'inscription/dossier/API auditees ; TypeScript web passe ; test cible `applicationValidation` 8/8 passe ; suite unitaire complete web 764 tests / 141 fichiers passe ; build Next 16.3.3 webpack passe avec 187 pages statiques.
- Limites : les champs optionnels `siret` restent dans les types internes pour ne pas casser la lecture d'anciens brouillons/dossiers deja stockes. Les tests d'integration Mongo modifies ne sont pas executes dans ce lot faute d'acces Mongo local autorise.

## Lot 76 : revente neutralisee jusque dans le webhook FedaPay et les specs generees

- Ecart traite : les routes de revente etaient deja fermees, mais le webhook FedaPay pouvait encore finaliser une ancienne commande `kind:'resale'` en appelant la logique historique, et les scripts de generation de specs continuaient a decrire revente/Stripe/gratuite comme parcours actifs.
- Les routes sources `/api/checkout/resale`, `/api/checkout/resale/fedapay`, `/api/events/[eventId]/resale-listings`, `/api/resale-listings/[listingId]`, `/api/tickets/resell` et `/api/cron/resale-expiry` sont supprimees du routage V1. Une URL directe tombe donc hors surface applicative au lieu de presenter une API de revente.
- Le webhook FedaPay n'appelle plus `fulfillResaleOrder` ni `releaseResaleOrder`. Une commande historique `kind:'resale'` approuvee ou annulee est liberee via `releaseOrder` et renvoie `ignored:'resale_disabled_v1'`, sans transfert de billet.
- Les points d'entree internes historiques `listTicketForResale`, `initiateResaleOrder` et `fulfillResaleOrder` retournent immediatement `resale_disabled_v1`. Le vieux corps du module reste conserve pour audit/migration, mais il n'est plus atteignable par ces exports V1.
- Un test unitaire isole couvre maintenant le webhook FedaPay avec une commande resale historique et verifie qu'il libere/ignore au lieu de finaliser. Le test V1 revente couvre aussi l'absence des fichiers de routes et les services internes neutralises.
- Les generateurs de documents fonctionnels remplacent les parcours de revente par des controles "revente exclue V1", retirent les routes `/api/resale-listings` des groupes actifs, remplacent Stripe/FedaPay par FedaPay sur les parcours de lancement, et ne presentent plus le billet gratuit comme parcours V1.
- Tests et controles : test cible revente/webhook 9 tests / 2 fichiers passe ; TypeScript web passe ; recherche ciblee propre sur les appels `fulfillResaleOrder`/`releaseResaleOrder` dans webhooks/checkout et sur les formulations actives "Acheter une revente", "checkout revente", "Stripe/FedaPay", "Fixtures Stripe", "billets gratuits" dans les generateurs. Les fichiers de routes revente V1 sont absents.
- Limites : le modele `ResaleListing`, les templates e-mails et le corps historique du service restent dans le code pour compatibilite/audit et migration des donnees existantes. Une suppression physique complete du module historique demanderait une migration base et une revue plus destructrice.

## Lot 77 : checkout gratuit public ferme pour la V1 payante

- Ecart traite : R58 retient les evenements payants et demande de ne pas prendre les anciens tests d'achat gratuit comme reference V1, mais `/api/checkout/free`, `freeCheckout` et le panneau checkout pouvaient encore emettre un billet public sans paiement.
- Le panneau checkout ne bascule plus vers `/api/checkout/free` quand le total est nul. Une selection a total zero affiche une erreur explicite `free_checkout_disabled_v1` et ne cree pas de commande.
- La route `/api/checkout/free` retourne maintenant `410 free_checkout_disabled_v1` sans lecture de session, sans acces Mongo et sans creation de billet.
- Le service historique `freeCheckout` retourne lui aussi `410 free_checkout_disabled_v1` immediatement. Les guestlists/invitations restent separees et ne sont pas confondues avec un checkout public gratuit.
- Les documents fonctionnels et architecture audites ne presentent plus Stripe, revente ou billet gratuit comme parcours actif de lancement ; les mentions restantes qualifient ces sujets comme historiques, exclus V1 ou lies aux guestlists.
- Tests et controles : test cible `freeCheckoutDisabledV1` + revente/webhook 11 tests / 3 fichiers passe ; TypeScript web passe ; suite unitaire complete web 768 tests / 143 fichiers passe ; build Next 16.3.3 webpack passe avec 183 pages statiques.
- Limites : les anciens rails `free` restent dans des modeles/services pour les guestlists, ventes agent cash et donnees historiques. Ce lot ferme le checkout public gratuit, pas toute representation interne d'une invitation sans paiement.
