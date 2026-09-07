# References de remboursement

## Protection applicative et base

Chaque nouvelle declaration ajoute sa reference, sans supprimer les precedentes, a declaredReferences. L'index unique compose organizerId/declaredReferences protege toutes les references de cette liste, y compris apres contestation et correction. La declaration, la nouvelle preuve et l'ajout a la liste sont une seule mise a jour atomique ; un conflit d'index ne doit pas envoyer de notification.

La recherche preventive consulte aussi declaredReference et les references de declaration conservees dans auditTrail.after.declaredReference et auditTrail.metadata.reference. Cela couvre les anciens dossiers lisibles, sans inventer de reference manquante. Les references sont comparees exactement apres suppression des espaces aux extremites ; ne pas changer arbitrairement leur casse ni fusionner des canaux sans connaitre le format officiel.

## Reprise historique avant deploiement

1. Suspendre les declarations et arreter les anciennes instances qui pourraient encore ecrire sans declaredReferences.
2. Sauvegarder les dossiers et leurs audits dans un stockage protege.
3. Inventorier, pour chaque dossier, l'union des references deja dans declaredReferences, de declaredReference et des references des actions refund_declared dans l'audit. Ne pas journaliser les preuves ou coordonnees en clair.
4. Detecter les references communes a plusieurs dossiers du meme organisateur. Ne pas choisir automatiquement le bon dossier, effacer une preuve ou modifier une reference officielle pour faire passer l'index. Faire examiner les conflits.
5. Reprendre l'union dans declaredReferences avec des mises a jour conditionnelles ; verifier que toutes les references historiques connues sont couvertes.
6. Creer/verifier l'index unique compose avec filtre partiel declaredReferences de type string (elements du tableau). Conserver l'ancien index de reference courante.
7. Tester declaration, correction, doublon et concurrence avant de rouvrir les ecritures.

Cette reprise de production n'a pas ete executee. La protection concurrente integrale des anciennes references ne doit pas etre declaree acquise avant cette verification ; les tests locaux couvrent les nouvelles ecritures, la recherche des anciens audits et l'index reel sur une base isolee.
