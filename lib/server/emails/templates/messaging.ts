// Emails liés à la messagerie — digest de messages non lus (throttlé, jamais
// un email par message), ajout à un groupe.
// Le rappel regroupe une attente longue OU une accumulation de messages.
import type { Email } from '../types'
import { DEFAULT_SITE, EMAIL_COLORS as C } from '../theme'
import { scopedWrap, heading, paragraph, button, escapeHtml } from '../layout'

const wrap = scopedWrap('messaging')

export function unreadMessagesReminderEmail(count: number, conversationUrl: string, site: string = DEFAULT_SITE): Email {
  const label = count === 1 ? '1 message attend ta réponse' : `${count} messages attendent ta réponse`
  return {
    subject: label,
    html: wrap(`${heading('Messages en attente')}${paragraph(label + ' dans une conversation. Consulte tes messages pour reprendre la discussion.')}${button(conversationUrl, 'Voir les messages')}`, { site, preheader: label }),
  }
}

export function newMessageDigestEmail(senderName: string, preview: string, conversationUrl: string, site: string = DEFAULT_SITE): Email {
  const inner = `
    ${heading('Nouveau message')}
    ${paragraph(`<strong style="color:${C.text};">${escapeHtml(senderName)}</strong> t'a envoyé un message :`)}
    ${paragraph(`<em style="color:${C.textMuted};">"${escapeHtml(preview)}"</em>`)}
    ${button(conversationUrl, 'Répondre')}
  `
  return { subject: `${senderName} t’a envoyé un message`, html: wrap(inner, { site, preheader: preview }) }
}

export function addedToGroupEmail(groupName: string, addedByName: string, groupUrl: string, site: string = DEFAULT_SITE): Email {
  const inner = `
    ${heading('Tu as été ajouté à un groupe')}
    ${paragraph(`<strong style="color:${C.text};">${escapeHtml(addedByName)}</strong> t'a ajouté au groupe <strong style="color:${C.text};">${escapeHtml(groupName)}</strong>.`)}
    ${button(groupUrl, 'Voir le groupe')}
  `
  return {
    subject: `Tu as été ajouté au groupe ${groupName}`,
    html: wrap(inner, { site, preheader: `Ajouté par ${addedByName}` }),
    inApp: { type: 'group', title: 'Tu as été ajouté à un groupe', body: `${groupName} — ajouté par ${addedByName}`, link: groupUrl, push: true },
  }
}
