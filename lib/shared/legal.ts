// Infos légales centralisées (mentions, contact, hébergeur). MAJ ce fichier dès
// que la structure juridique béninoise sera immatriculée (RCCM/IFU, adresse,
// etc.) — voir footerNotice sur chaque page légale.

export const LEGAL = {
  brand: 'LIVEINBLACK',
  // À remplir une fois la structure juridique créée :
  legalForm: '', // ex: 'SARL'
  companyName: '', // ex: 'LIVEINBLACK SARL'
  registrationNumber: '', // ex: RCCM/IFU
  siren: '', // ancien champ France, conservé vide pour compatibilité d'affichage
  rcs: '', // ancien champ France, conservé vide pour compatibilité d'affichage
  capital: '', // ex: '1 000 000 FCFA'
  vatNumber: '',
  // Adresse du siège — à remplir
  address: {
    street: '',
    zip: '',
    city: '',
    country: 'Bénin',
  },
  // Représentant légal
  director: {
    role: 'Représentant légal',
    name: 'Chady Hage',
  },
  // Contact
  contactEmail: 'contact@liveinblack.com',
  supportEmail: 'contact@liveinblack.com',
  phone: '', // optionnel
  // Site
  domain: 'liveinblack.com',
  url: 'https://liveinblack.com',
  // Hébergeur
  host: {
    name: 'Vercel Inc.',
    address: '440 N Barranca Ave #4133, Covina, CA 91723, USA',
    website: 'https://vercel.com',
  },
  // Sous-processeurs (RGPD)
  subprocessors: [
    { name: 'Vercel Inc.', purpose: 'Hébergement', country: 'USA', dpa: 'https://vercel.com/legal/dpa' },
    { name: 'MongoDB, Inc. (MongoDB Atlas)', purpose: 'Hébergement de la base de données (comptes, événements, messages, transactions)', country: 'USA / UE', dpa: 'https://www.mongodb.com/legal/data-processing-agreement' },
    { name: 'Cloudinary Ltd.', purpose: "Hébergement des images et documents (photos de profil, visuels d'événements, portfolios prestataires, justificatifs d'identité des candidatures)", country: 'USA', dpa: 'https://cloudinary.com/dpa' },
    { name: 'FedaPay S.A.', purpose: 'Paiements en FCFA (mobile money et cartes)', country: 'Bénin', dpa: 'https://www.fedapay.com/privacy-policies' },
    { name: 'Resend, Inc.', purpose: 'Envoi des emails transactionnels (validation de dossier, notifications)', country: 'USA', dpa: 'https://resend.com/legal/dpa' },
  ],
  // DPO
  dpo: null as { name: string; email: string } | null, // ex: { name: 'XX', email: 'dpo@liveinblack.com' }
  // Autorité de contrôle
  authority: {
    name: 'Autorité de protection des données du Bénin',
    url: 'https://apdp.bj',
    address: '',
  },
  lastUpdate: 'Avril 2026',
}

// Helper d'affichage : retourne soit la valeur, soit un placeholder
export const LEGAL_DISPLAY = {
  ...LEGAL,
  companyDisplay: LEGAL.companyName || `${LEGAL.brand} — projet en cours d'immatriculation`,
  addressDisplay:
    [LEGAL.address.street, LEGAL.address.zip, LEGAL.address.city, LEGAL.address.country].filter(Boolean).join(', ') ||
    'Adresse en cours de communication',
  registrationDisplay: LEGAL.registrationNumber || "RCCM/IFU en cours d'attribution",
  sirenDisplay: LEGAL.siren || "RCCM/IFU en cours d'attribution",
}
