# Rappels de messagerie V1

## Regle implementee

- Plus d'e-mail dans le chemin d'envoi unitaire d'un message.
- Un rappel regroupe les messages en attente dans une conversation pour un destinataire.
- Declenchement apres 30 minutes d'attente OU 10 messages, avec au moins 60 minutes entre deux rappels de cette conversation.
- Ces valeurs sont des valeurs techniques par defaut, pas des seuils definitivement approuves par Chady. Elles sont centralisees dans `lib/server/messaging/messagingNotificationUtils.ts`.
- Un lot deja rappele n'est pas renvoye a l'infini. Les nouveaux messages sont eligibles selon les memes conditions.
- Presence active : dernier heartbeat datant de moins de 45 secondes. Le web authentifie envoie un heartbeat toutes les 20 secondes sur toutes les pages visibles. Un onglet masque cesse de le faire. Le choix de masquer sa presence aux autres utilisateurs n'autorise pas un e-mail.
- Relecture des lectures, reponses, appartenance, blocages dans les deux sens, sourdines et suppressions avant envoi. Les messages systeme ne declenchent pas ces rappels.
- Les e-mails de securite, billets et remboursements ne sont pas soumis a cette politique. Les push restent un canal distinct.

## Traitement durable

`/api/cron/message-digests`, declare toutes les cinq minutes dans `vercel.json`, utilise le controle CRON_SECRET commun. Il faut verifier son activation sur le deploiement reel ; ajouter une ligne locale ne prouve pas son execution en production.

La publication d'un message, transfert ou sondage reveille sa conversation en base. Le traitement prend un bail exclusif de cinq minutes, borne chaque invocation et conserve un curseur pour les grands groupes. Une revision empeche de perdre le reveil d'un nouveau message pendant le traitement. Les anciennes conversations non reveillees ne font pas l'objet d'un envoi massif retroactif.

Le chemin d'envoi standard (texte, image, vocal, offre, evenement) enregistre desormais message, apercu et reveil dans une meme transaction MongoDB. Le participant doit encore appartenir a la conversation au moment de cette ecriture. Une panne ou une conversation disparue annule le message, sans laisser de message orphelin non rappele. Les notifications/push sont declenches seulement apres commit.

Les transferts et les deux creations de sondage utilisent maintenant le meme helper `persistMessageWithWake`. La transaction d'un transfert porte sur une conversation destinataire, pas sur l'ensemble des destinations. Les votes et messages systeme n'ont pas ete convertis en envois de rappels.

La collection MessageDigest conserve le curseur du dernier lot couvert et la requete d'e-mail en attente. Lors d'une reprise, destinataire, contenu et cle d'idempotence sont identiques. Un echec ne devient pas un succes en base. Les donnees de la requete sont effacees apres succes ou lorsqu'elle devient caduque.

Resend documente une fenetre d'idempotence de 24 heures : https://resend.com/docs/dashboard/emails/idempotency-keys (consulte le 6 septembre 2026). Par prudence, une tentative incertaine de plus de 23 heures passe en `delivery_confirmation_required` sans nouvel envoi automatique. Le cron renvoie 503 pour les echecs/incertitudes afin de ne pas masquer ces cas a la supervision. L'operateur doit verifier le resultat fournisseur avant toute regularisation ; ne pas simplement effacer les cles en attente.

Le plan Vercel doit autoriser la frequence demandee : https://vercel.com/docs/cron-jobs/usage-and-pricing. Aucun changement de plan ni depense n'a ete effectue.

## Verification locale

- 19 tests MongoDB dedies : attente seule, accumulation seule, cooldown, lot non repete, presence invisible, lecture/reponse, blocages, sourdine, depart, suppression, compte desactive, deux crons concurrents, reprise de panne, bail expire, lecture avant reprise, fenetre fournisseur depassee, nouveau message pendant traitement.
- Suite elargie avec conversations/actions/sondages : 113 tests d'integration passes sur base locale isolee, fournisseur e-mail simule.
- Trois tests de route cron : secret absent, refus non autorise, execution autorisee, erreur visible pour supervision.
- Deux tests navigateur : presence sur page publique avec session simulee, arriere-plan puis retour, absence de presence deconnectee. Ils ne prouvent pas une session native mobile.

## Limites ouvertes

La presence globale est maintenant implementee dans LIB_Mobile : toutes les 20 secondes si authentifie et actif, arret/annulation en arriere-plan, au demontage et au changement de compte ; reprise immediate au retour. Les evenements Android focus/blur et la visibilite de la preview web sont pris en compte. Cinq tests locaux couvrent le controleur et son raccordement dans les sources. Cela ne constitue pas encore une recette de la presence sur appareil ni un test e-mail natif de bout en bout.

Recette avec le fournisseur reel et monitoring du cron apres deploiement ; verification sur appareil de la presence Android/iOS ; choix final des seuils et de la portee du regroupement. Les messages historiques ne sont pas repris automatiquement pour eviter une campagne surprise. L'envoi standard est transactionnel (six tests MongoDB : commit, panne avant/apres reveil, retrait du participant, conversation disparue, dix envois concurrents). Neuf tests supplementaires couvrent le commit et les pannes avant/apres reveil des transferts et deux sondages ; suite elargie de 128 tests MongoDB passee. Les echecs de notifications/push apres commit, les transferts partiels vers plusieurs destinations, l'idempotence des nouvelles tentatives client et les changements concurrents de blocage/sourdine restent a traiter. La garantie externe absolue d'envoi unique n'est pas revendiquee hors de la fenetre d'idempotence fournisseur.
