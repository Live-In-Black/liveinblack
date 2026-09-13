// Templates historiques de la bourse de revente officielle de billets.
// La revente est exclue de la V1 : ne pas exposer ces e-mails dans le catalogue actif.
import type { Email } from '../types'
import { DEFAULT_SITE } from '../theme'
import { scopedWrap, heading, paragraph, note, button, escapeHtml } from '../layout'

const wrap = scopedWrap('resale')

export function resaleListingCreatedEmail(eventName: string, priceLabel: string, manageUrl: string, site: string = DEFAULT_SITE): Email {
  const evName = escapeHtml(eventName)
  const inner = `
    ${heading('Action indisponible en V1')}
    ${paragraph(`La revente du billet pour <strong style="color:inherit;">${evName}</strong> n’est pas disponible dans le lancement Bénin.`)}
    ${button(`${site}/profile/billets`, 'Voir mes billets', 'outline')}
  `
  return {
    subject: `Revente indisponible pour ${eventName}`,
    html: wrap(inner, { site, preheader: 'La revente est exclue du lancement Bénin.' }),
    inApp: { type: 'resale', title: 'Revente indisponible', body: eventName, link: `${site}/profile/billets`, push: true },
  }
}

export function resaleListingSoldEmail(eventName: string, netAmountLabel: string, payoutDelayLabel: string, site: string = DEFAULT_SITE): Email {
  const evName = escapeHtml(eventName)
  const inner = `
    ${heading('Suivi historique', 'accent')}
    ${paragraph(`Une ancienne opération liée au billet <strong style="color:inherit;">${evName}</strong> nécessite une vérification du support.`)}
    ${note(`Montant historique : ${escapeHtml(netAmountLabel)}. Délai indiqué à l’époque : ${escapeHtml(payoutDelayLabel)}.`)}
  `
  return {
    subject: `Suivi historique pour ${eventName}`,
    html: wrap(inner, { site, preheader: 'Opération historique à vérifier.' }),
    inApp: { type: 'resale', title: 'Suivi historique', body: eventName, push: true },
  }
}

export function resaleListingExpiredEmail(eventName: string, site: string = DEFAULT_SITE): Email {
  const evName = escapeHtml(eventName)
  const inner = `
    ${heading('Action indisponible en V1')}
    ${paragraph(`La revente du billet pour <strong style="color:inherit;">${evName}</strong> est exclue du lancement Bénin.`)}
  `
  return {
    subject: `Revente indisponible pour ${eventName}`,
    html: wrap(inner, { site, preheader: 'La revente est exclue du lancement Bénin.' }),
    inApp: { type: 'resale', title: 'Revente indisponible', body: eventName, link: `${site}/profile/billets`, push: true },
  }
}
