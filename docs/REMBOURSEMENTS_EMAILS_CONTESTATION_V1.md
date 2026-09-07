# Decisions de contestation : livraison des e-mails

La decision et `contestEmailState=pending` sont enregistrees dans la meme mise a jour conditionnelle du dossier. L'echec d'un e-mail ne remet pas en cause la decision, ne reactive pas le billet et ne cree pas de paiement.

`/api/cron/refund-emails` est protege par le mecanisme CRON_SECRET commun. Configuration locale : toutes les cinq minutes, 30 dossiers maximum et budget de boucle de 40 secondes. Bail de cinq minutes par dossier et jeton conditionnant les mises a jour. Un appel fournisseur lent peut etre interrompu par la limite de la fonction ; la reprise conserve l'identifiant d'envoi.

Le premier traitement prepare un payload chiffre (destinataire, expediteur, objet et HTML) conserve pour les reprises, meme si les informations utilisateur ou evenement changent. Le contenu contient la decision echappee et ne promet ni reception des fonds ni nouveau paiement. `sent` signifie acceptation par le fournisseur, pas lecture ni livraison effective dans la boite du participant.

Les erreurs restent en attente avec prochaine tentative dans cinq minutes. Au-dela de 23 heures depuis la premiere tentative, aucun renvoi automatique : etat `uncertain`, cron HTTP 503 pour supervision. Cette marge est inferieure aux 24 heures de deduplication documentees par [Resend](https://resend.com/docs/dashboard/emails/idempotency-keys). Verifier les journaux fournisseur avant toute action manuelle ; ne pas remettre aveuglement le dossier en attente avec une nouvelle cle.

## Avant production

- Configurer et verifier CRON_SECRET, Resend, expediteur et cle de chiffrement ; conserver les cles permettant les reprises des payloads existants.
- Creer l'index non unique `contestEmailState/contestEmailNextAt/contestEmailLeaseUntil`, ajoute au script d'index. Ne pas confondre avec les migrations des references de remboursement historiques.
- Deployer la route et le cron puis tester leur authentification et une livraison autorisee. Aucun deploiement ou envoi reel n'est atteste par les tests locaux.
- Auditer les anciennes contestations deja traitees sans e-mail : aucun envoi retrospectif automatique n'a ete active, pour eviter les doublons ou l'envoi de decisions obsoletes.
- Definir l'exploitation des etats uncertain, la conservation des payloads, le traitement des adresses supprimees et les retours de livraison fournisseur.

Portee : notification par e-mail de la decision sur contestation uniquement. Les autres notifications de remboursement et leur reprise durable restent a auditer. Les tests utilisent une base isolee et simulent le fournisseur.
