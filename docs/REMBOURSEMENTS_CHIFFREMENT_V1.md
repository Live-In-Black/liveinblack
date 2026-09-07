# Chiffrement des remboursements

## Configuration et compatibilite

Le serveur utilise REFUND_CODE_SECRET, puis NEXTAUTH_SECRET, puis AUTH_SECRET, dans cet ordre. Il n'utilise plus de cle publique de secours. Sans secret configure, une nouvelle operation de chiffrement echoue avec refund_encryption_secret_required. Une lecture indechiffrable retourne null, jamais un texte presume valide.

Le format AES-256-GCM reste IV.tag.ciphertext en base64url. Les codes de retrait restent normalises en majuscules ; les nouvelles destinations sensibles conservent exactement leur texte. Les anciens textes deja normalises restent lisibles avec la meme cle, mais leur casse perdue ne peut pas etre reconstituee automatiquement.

## Avant deploiement

- Verifier la presence du secret effectivement utilise dans chaque environnement, sans afficher sa valeur ni des donnees dechiffrees dans les journaux.
- Ne pas ajouter ou changer REFUND_CODE_SECRET a l'aveugle : sa priorite modifierait la cle utilisee si les donnees existantes dependent du secret d'authentification.
- Conserver une sauvegarde chiffree et un acces controle aux cles historiques avant toute rotation.
- Si des donnees ont ete chiffrees sans aucun secret configure avec l'ancien repli public, les considerer insuffisamment protegees. Le runtime ne tente plus ce repli. Leur inventaire et leur migration doivent etre effectues dans une procedure administrative isolee, autorisee, journalisee, sans export de texte clair. Les codes de retrait encore actifs doivent etre renouveles avec information des beneficiaires et invalidation des anciens codes.
- Verifier le nombre de donnees lues/migrees et les parcours de retrait avant activation de la release. Ne jamais remplacer une destination indechiffrable par le telephone de contact par supposition.

Aucune inspection ni migration des donnees de production n'a ete effectuee pour ce correctif. Les politiques de conservation, l'habilitation d'acces, la rotation versionnee des cles et la procedure de recuperation restent a finaliser.
