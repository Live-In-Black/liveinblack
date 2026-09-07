// Emails côté acheteur pour annulation/report d'événement et remboursement.
// Distincts des emails "abonnés" de templates/followers.ts — ici on
// s'adresse aux gens qui ont VRAIMENT un billet payé.
//
// Branchés depuis les parcours annulation/report et dossiers RefundCase.
import type { Email } from '../types'
import { DEFAULT_SITE, EMAIL_COLORS as C } from '../theme'
import { scopedWrap, heading, paragraph, note, button, escapeHtml } from '../layout'

const wrap = scopedWrap('refund')

export function refundRequestCreatedEmail(eventName: string, amountLabel: string, pickup: { code?: string; point?: string | null; address?: string | null }, site: string = DEFAULT_SITE): Email {
  const details = pickup.code
    ? note(`Code de retrait : <strong>${escapeHtml(pickup.code)}</strong><br/>Point : ${escapeHtml(pickup.point || '')}<br/>Adresse : ${escapeHtml(pickup.address || '')}`) + paragraph('Toute personne présentant ce code peut retirer le montant. Garde-le confidentiel. La signature est obligatoire à la remise. Si tu ne peux pas te déplacer, demande le passage en remboursement individuel depuis ton dossier.')
    : paragraph('Le remboursement individuel sera effectué par l’organisateur dans les meilleurs délais. Consulte ton dossier pour fournir les informations nécessaires.')
  return {
    subject: `Demande de remboursement enregistrée pour ${eventName}`,
    html: wrap(`${heading('Ton dossier de remboursement est créé')}${paragraph(`Montant à rembourser : <strong>${escapeHtml(amountLabel)}</strong> pour ${escapeHtml(eventName)}. Ton billet est invalidé. Aucun versement n’est confirmé à ce stade.`)}${details}${button(`${site}/profile/billets`, 'Voir mon dossier')}`, { site, preheader: 'Demande enregistrée, paiement non encore effectué.' }),
    inApp: { type: 'refund', title: 'Dossier de remboursement créé', body: `${amountLabel} à rembourser par l’organisateur pour ${eventName}.`, link: `${site}/profile/billets`, push: true },
  }
}

export function eventCancelledRefundEmail(eventName: string, amountLabel: string, delayLabel: string, reason: string | null, site: string = DEFAULT_SITE): Email {
  const evName = escapeHtml(eventName)
  const inner = `
    ${heading(`${eventName} est annulé`, 'danger')}
    ${paragraph(`<strong style="color:inherit;">${evName}</strong> a été annulé. Un dossier de remboursement de <strong style="color:inherit;">${amountLabel}</strong> est ouvert.`)}
    ${reason ? paragraph(`<strong style="color:inherit;">Motif :</strong> ${escapeHtml(reason)}`) : ''}
    ${note(`Le dossier sera traité ${delayLabel}. Live In Black suit l'opération, mais le remboursement est financé et exécuté par l'organisateur.`)}
    ${button(`${site}/events`, "Découvrir d'autres événements", 'outline')}
  `
  return {
    subject: `${eventName} est annulé — dossier de remboursement ouvert`,
    html: wrap(inner, { site, preheader: `Dossier de remboursement de ${amountLabel}.` }),
    inApp: { type: 'refund', title: `${eventName} est annulé`, body: `Dossier de remboursement de ${amountLabel}.`, link: `${site}/profile/billets`, push: true },
  }
}

export function eventCancelledCashPickupEmail(
  eventName: string,
  amountLabel: string,
  pickupCode: string,
  refundPointName: string,
  refundPointAddress: string,
  reason: string | null,
  site: string = DEFAULT_SITE
): Email {
  const evName = escapeHtml(eventName)
  const point = escapeHtml(refundPointName)
  const address = escapeHtml(refundPointAddress)
  const code = escapeHtml(pickupCode)
  const inner = `
    ${heading(`${eventName} est annulé`, 'danger')}
    ${paragraph(`<strong style="color:inherit;">${evName}</strong> a été annulé. Ton remboursement de <strong style="color:inherit;">${amountLabel}</strong> est prévu en retrait espèces au point attribué.`)}
    ${reason ? paragraph(`<strong style="color:inherit;">Motif :</strong> ${escapeHtml(reason)}`) : ''}
    ${note(`<strong>Code de retrait :</strong> ${code}<br/><strong>Point :</strong> ${point}<br/><strong>Adresse :</strong> ${address}`)}
    ${paragraph(`Toute personne présentant ce code valide peut retirer le montant exact. Garde-le confidentiel : une fois validé par l'agent avec signature, il devient définitivement inutilisable.`)}
    ${button(`${site}/profile/billets`, 'Voir mon dossier', 'primary')}
    ${button(`${site}/profile/billets`, 'Je ne peux pas me déplacer', 'outline')}
  `
  return {
    subject: `${eventName} est annulé — code de retrait ${pickupCode.slice(-4)}`,
    html: wrap(inner, { site, preheader: `Retrait espèces de ${amountLabel} au point ${refundPointName}.` }),
    inApp: {
      type: 'refund',
      title: `${eventName} est annulé`,
      body: `Code ${pickupCode.slice(-4)} · ${amountLabel} à retirer au point ${refundPointName}.`,
      link: `${site}/profile/billets`,
      push: true,
    },
  }
}

export function eventPostponedTicketHolderEmail(eventName: string, previousWhen: string, newWhen: string, refundUrl: string, site: string = DEFAULT_SITE): Email {
  const evName = escapeHtml(eventName)
  const inner = `
    ${heading(`${eventName} est reporté`, 'accent')}
    ${paragraph(`<strong style="color:inherit;">${evName}</strong> a été reporté à une nouvelle date. Ton billet reste valable.`)}
    ${paragraph(`<span style="color:${C.textMuted};text-decoration:line-through;">${escapeHtml(previousWhen)}</span><br/><strong style="color:${C.primaryText};">Nouvelle date : ${escapeHtml(newWhen)}</strong>`)}
    ${button(refundUrl, 'Je ne peux pas venir — demander un remboursement', 'outline')}
  `
  return {
    subject: `${eventName} est reporté au ${newWhen}`,
    html: wrap(inner, { site, preheader: 'Ton billet reste valable à la nouvelle date.' }),
    inApp: { type: 'refund', title: `${eventName} est reporté`, body: `Nouvelle date : ${newWhen}. Ton billet reste valable.`, link: refundUrl, push: true },
  }
}

export function refundConfirmedEmail(eventName: string, amountLabel: string, delayLabel: string, site: string = DEFAULT_SITE): Email {
  const evName = escapeHtml(eventName)
  const inner = `
    ${heading('Ton remboursement est confirmé', 'accent')}
    ${paragraph(`Ton remboursement de <strong style="color:inherit;">${amountLabel}</strong> pour <strong style="color:inherit;">${evName}</strong> a été traité.`)}
    ${note(`Le montant apparaîtra sur ton moyen de paiement sous ${delayLabel}.`)}
  `
  return {
    subject: `Ton remboursement pour ${eventName} est confirmé`,
    html: wrap(inner, { site, preheader: `Remboursement de ${amountLabel} confirmé.` }),
    inApp: { type: 'refund', title: 'Remboursement confirmé', body: `${amountLabel} pour ${eventName}.`, push: true },
  }
}

export function cashRefundCollectedEmail(eventName: string, amountLabel: string, site: string = DEFAULT_SITE): Email {
  return {
    subject: `Retrait en espèces enregistré pour ${eventName}`,
    html: wrap(`${heading('Remise en espèces enregistrée')}${paragraph(`L’agent a enregistré la remise de <strong>${escapeHtml(amountLabel)}</strong> au porteur du code de remboursement pour ${escapeHtml(eventName)}, avec une signature.`)}${note('Le code a été utilisé et ne permet plus de retrait. Aucun virement supplémentaire ne sera effectué pour ce remboursement.')}${button(`${site}/profile/billets`, 'Consulter mon dossier')}`, { site, preheader: 'Remise en espèces enregistrée, code utilisé.' }),
    inApp: { type: 'refund', title: 'Retrait en espèces enregistré', body: `${amountLabel} pour ${eventName}. Le code a été utilisé.`, link: `${site}/profile/billets`, push: true },
  }
}

export function refundDeclaredEmail(eventName: string, amountLabel: string, reference: string, channel: string, site: string = DEFAULT_SITE): Email {
  return {
    subject: `Remboursement déclaré par l’organisateur pour ${eventName}`,
    html: wrap(`${heading('L’organisateur déclare avoir effectué ton remboursement')}${paragraph(`Montant déclaré : <strong>${escapeHtml(amountLabel)}</strong> pour ${escapeHtml(eventName)}.`)}${note(`Référence : ${escapeHtml(reference)}<br/>Canal : ${escapeHtml(channel)}`)}${paragraph('Cette déclaration ne confirme pas que tu as reçu les fonds. Vérifie ton compte et consulte la preuve dans ton dossier. Tu peux confirmer la réception ou sélectionner « Je n’ai pas reçu le remboursement ».')}${button(`${site}/profile/billets`, 'Vérifier mon remboursement')}`, { site, preheader: 'Vérifie la réception des fonds et la preuve dans ton dossier.' }),
    inApp: { type: 'refund', title: 'Remboursement déclaré', body: `${amountLabel} déclarés pour ${eventName}. Vérifie la réception des fonds.`, link: `${site}/profile/billets`, push: true },
  }
}

export function refundFailedEmail(eventName: string, reason: string | null, supportUrl: string, site: string = DEFAULT_SITE): Email {
  const evName = escapeHtml(eventName)
  const inner = `
    ${heading('Un problème est survenu avec ton remboursement', 'danger')}
    ${paragraph(`Le remboursement de ton billet pour <strong style="color:inherit;">${evName}</strong> n'a pas pu être traité${reason ? ` (${escapeHtml(reason)})` : ''}.`)}
    ${button(supportUrl, 'Contacter le support', 'danger')}
  `
  return {
    subject: `Ton remboursement pour ${eventName} a rencontré un problème`,
    html: wrap(inner, { site, preheader: 'Une action est nécessaire de ta part.' }),
    inApp: { type: 'refund', title: 'Problème avec ton remboursement', body: `${eventName} — action requise.`, link: supportUrl, push: true },
  }
}

export function refundContestResolvedEmail(eventName: string, resolution: string, site: string = DEFAULT_SITE): Email {
  return {
    subject: `Réponse à ta contestation pour ${eventName}`,
    html: wrap(`${heading('L’organisateur a répondu à ta contestation')}${paragraph(`Événement : ${escapeHtml(eventName)}.`)}${note(escapeHtml(resolution).replace(/\n/g, '<br/>'))}${paragraph('Cette décision ne confirme pas la réception des fonds et ne déclenche aucun nouveau paiement. Ton billet reste invalide. Si le litige persiste, poursuis les échanges avec le support de l’organisateur depuis ton dossier.')}${button(`${site}/profile/billets`, 'Consulter mon dossier')}`, { site, preheader: 'Consulte la décision motivée de l’organisateur.' }),
  }
}

export function ticketInvalidatedByResaleEmail(eventName: string, site: string = DEFAULT_SITE): Email {
  const evName = escapeHtml(eventName)
  const inner = `
    ${heading('Ton billet a été transféré')}
    ${paragraph(`Ton billet pour <strong style="color:inherit;">${evName}</strong> a été vendu et n'est plus valable sur ton compte.`)}
  `
  return {
    subject: `Ton billet pour ${eventName} a été transféré`,
    html: wrap(inner, { site, preheader: 'Confirmation de vente de ton billet.' }),
    inApp: { type: 'resale', title: 'Ton billet a été transféré', body: eventName, link: `${site}/profile/billets`, push: true },
  }
}
