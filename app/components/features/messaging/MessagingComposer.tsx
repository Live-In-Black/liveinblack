'use client'

import { Button, Textarea } from '@/app/components/ui'
import { BarChart3, CalendarDays, Camera, Check, Image as ImageIcon, Mic, Pause, Play, Send, Trash2, X } from 'lucide-react'
import { formatRecordingDuration } from './messagingComposerUtils'
import type { ConversationMember } from './types'

export const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 14,
  border: '1px solid var(--border)',
  background: 'var(--field-bg)',
  color: 'var(--text)',
  fontSize: 'var(--font-size-body-sm)',
  padding: '12px 18px',
  marginBottom: 10,
  fontFamily: 'inherit',
}

export default function MessagingComposer({
  mentionMatches,
  onApplyMention,
  editingMessage,
  onCancelEdit,
  replyTo,
  onCancelReply,
  isRecording,
  isRecordingPaused,
  recordDuration,
  onCancelRecording,
  onSendRecording,
  onToggleRecordingPause,
  onOpenAttachMenu,
  showAttachMenu,
  onCloseAttachMenu,
  onOpenPhotoPicker,
  onOpenCamera,
  onOpenPoll,
  onOpenEventShare,
  fileInputRef,
  onPhotoFileChange,
  activeConversationId,
  composerText,
  onComposerChange,
  onComposerKeyDown,
  onSendText,
  busy,
  editingMessageId,
  onMicPointerDown,
  onMicPointerUp,
}: {
  mentionMatches: ConversationMember[]
  onApplyMention: (member: ConversationMember) => void
  editingMessage: boolean
  onCancelEdit: () => void
  replyTo: { senderName: string; preview: string } | null
  onCancelReply: () => void
  isRecording: boolean
  isRecordingPaused: boolean
  recordDuration: number
  onCancelRecording: () => void
  onSendRecording: () => void
  onToggleRecordingPause: () => void
  onOpenAttachMenu: () => void
  showAttachMenu: boolean
  onCloseAttachMenu: () => void
  onOpenPhotoPicker: () => void
  onOpenCamera: () => void
  onOpenPoll: () => void
  onOpenEventShare: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onPhotoFileChange: (event: React.ChangeEvent<HTMLInputElement>, targetConversationId: string | null) => void
  activeConversationId: string | null
  composerText: string
  onComposerChange: (value: string) => void
  onComposerKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSendText: () => void
  busy: boolean
  editingMessageId: string | null
  onMicPointerDown: () => void
  onMicPointerUp: () => void
}) {
  return (
    <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)' }}>
      {mentionMatches.length > 0 ? (
        <div style={{ marginBottom: 8, background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 10, overflow: 'hidden' }}>
          {mentionMatches.map((member) => (
            <Button
              key={member.userId}
              variant="ghost"
              onClick={() => onApplyMention(member)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                color: 'var(--text)',
                fontSize: 'var(--font-size-callout)',
                fontWeight: 400,
              }}
            >
              @{member.name}
            </Button>
          ))}
        </div>
      ) : null}

      {editingMessage ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--surface-2)',
            borderRadius: 10,
            padding: '6px 10px',
            marginBottom: 8,
            borderLeft: '3px solid var(--gold)',
          }}
        >
          <p style={{ fontSize: 'var(--font-size-footnote)', fontWeight: 600, color: 'var(--gold)', margin: 0 }}>Modifier le message</p>
          <Button variant="ghost" aria-label="Annuler la modification" onClick={onCancelEdit} style={{ padding: 0 }}>
            <X size={14} />
          </Button>
        </div>
      ) : null}

      {replyTo && !editingMessage ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--surface-2)',
            borderRadius: 10,
            padding: '6px 10px',
            marginBottom: 8,
            borderLeft: '3px solid var(--violet)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 'var(--font-size-caption)', fontWeight: 600, color: 'var(--primary)', margin: '0 0 1px' }}>Répondre à {replyTo.senderName}</p>
            <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--text-faint)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {replyTo.preview}
            </p>
          </div>
          <Button variant="ghost" onClick={onCancelReply} style={{ padding: 0 }}>
            <X size={14} />
          </Button>
        </div>
      ) : null}

      {isRecording ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minHeight: 58,
            padding: '7px 8px 7px 12px',
            background: 'var(--surface)',
            borderRadius: 8,
            border: '1px solid var(--border-strong)',
          }}
        >
          <Button variant="ghost" onClick={onCancelRecording} style={{ width: 42, height: 42, minWidth: 42, minHeight: 42, color: 'var(--pink)', padding: 0, borderRadius: '50%' }} aria-label="Supprimer l’enregistrement">
            <Trash2 size={19} />
          </Button>
          <div style={{ minWidth: 52, display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pink)', animation: isRecordingPaused ? 'none' : 'lib-pulse 1.2s infinite' }} />
            <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 'var(--font-size-callout)', fontWeight: 700, color: 'var(--text)' }}>{formatRecordingDuration(recordDuration)}</span>
          </div>
          <div aria-hidden="true" style={{ height: 30, flex: 1, minWidth: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, overflow: 'hidden' }}>
            {Array.from({ length: 22 }, (_, index) => (
              <span key={index} style={{ width: 3, height: `${8 + ((index * 7) % 20)}px`, borderRadius: 3, background: index < 14 ? 'var(--primary)' : 'var(--fill-secondary)', opacity: isRecordingPaused ? .55 : 1 }} />
            ))}
          </div>
          <Button variant="secondary" onClick={onToggleRecordingPause} style={{ width: 42, height: 42, minWidth: 42, minHeight: 42, padding: 0, borderRadius: '50%' }} aria-label={isRecordingPaused ? 'Reprendre l’enregistrement' : 'Mettre en pause'}>
            {isRecordingPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
          </Button>
          <Button variant="primary" onClick={onSendRecording} style={{ borderRadius: '50%', width: 44, height: 44, minHeight: 44, minWidth: 44, padding: 0, background: 'var(--primary)', color: 'var(--primary-ink)' }} aria-label="Envoyer le message vocal">
            <Send size={17} />
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', position: 'relative' }}>
          <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
            <ComposerIconButton title={showAttachMenu ? 'Fermer les options' : 'Joindre'} open={showAttachMenu} onClick={showAttachMenu ? onCloseAttachMenu : onOpenAttachMenu}>
              <span aria-hidden="true" style={{ display: 'block', transform: showAttachMenu ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform .24s cubic-bezier(.2,.9,.2,1)', fontSize: 24, lineHeight: 1 }}>+</span>
            </ComposerIconButton>
            {showAttachMenu ? (
              <>
                <Button variant="ghost" onClick={onCloseAttachMenu} aria-label="Fermer les options" style={{ position: 'fixed', inset: 0, zIndex: 45, minHeight: 0, padding: 0, border: 0, background: 'transparent' }} />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 54,
                    left: 0,
                    zIndex: 55,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    padding: 6,
                    background: 'var(--modal-surface)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 16,
                    boxShadow: '0 16px 40px rgba(var(--black-rgb), 0.32)',
                    backdropFilter: 'blur(24px) saturate(140%)',
                    minWidth: 170,
                    animation: 'menu-in .18s cubic-bezier(.22,.9,.3,1) both',
                  }}
                >
                  <AttachmentMenuItem
                    icon={<ImageIcon size={18} />}
                    label="Photo / Image"
                    onClick={onOpenPhotoPicker}
                    onClose={onCloseAttachMenu}
                  />
                  <AttachmentMenuItem
                    icon={<Camera size={18} />}
                    label="Caméra"
                    onClick={onOpenCamera}
                    onClose={onCloseAttachMenu}
                  />
                  <AttachmentMenuItem
                    icon={<BarChart3 size={18} />}
                    label="Sondage"
                    onClick={onOpenPoll}
                    onClose={onCloseAttachMenu}
                  />
                  <AttachmentMenuItem
                    icon={<CalendarDays size={18} />}
                    label="Partager un événement"
                    onClick={onOpenEventShare}
                    onClose={onCloseAttachMenu}
                  />
                </div>
              </>
            ) : null}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(event) => onPhotoFileChange(event, activeConversationId)} />
          </div>
          <Textarea
            value={composerText}
            onChange={(event) => onComposerChange(event.target.value)}
            onKeyDown={onComposerKeyDown}
            placeholder="Écris un message…"
            rows={1}
            style={{
              ...inputStyle,
              marginBottom: 0,
              flex: 1,
              resize: 'none',
              fieldSizing: 'content',
              minHeight: 44,
              height: 44,
              maxHeight: 120,
              overflowY: 'auto',
              borderRadius: 22,
              background: 'var(--surface)',
            }}
          />
          {composerText.trim() ? (
            <Button
              variant="primary"
              onClick={onSendText}
              disabled={busy}
              aria-label={editingMessageId ? 'Modifier' : 'Envoyer'}
              title={editingMessageId ? 'Modifier' : 'Envoyer'}
              style={{
                width: 44,
                height: 44,
                minWidth: 44,
                minHeight: 44,
                padding: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-ink)',
                background: busy ? 'var(--primary-a52)' : 'var(--primary)',
                cursor: busy ? 'default' : 'pointer',
                flexShrink: 0,
              }}
            >
              {editingMessageId ? <Check size={18} /> : <Send size={17} />}
            </Button>
          ) : (
            <Button
              variant="primary"
              onPointerDown={onMicPointerDown}
              onPointerUp={onMicPointerUp}
              style={{
                width: 44,
                height: 44,
                minWidth: 44,
                minHeight: 44,
                padding: 0,
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'var(--primary-ink)',
                flexShrink: 0,
              }}
              aria-label="Message vocal"
            >
              <Mic size={18} />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function ComposerIconButton({ title, open, onClick, children }: { title: string; open?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button
      variant="secondary"
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{
        position: 'relative',
        zIndex: 55,
        width: 44,
        height: 44,
        minWidth: 44,
        minHeight: 44,
        padding: 0,
        borderRadius: '50%',
        fontSize: 'var(--font-size-body-sm)',
        background: open ? 'var(--primary)' : 'var(--surface-2)',
        color: open ? 'var(--primary-ink)' : 'var(--text)',
      }}
    >
      {children}
    </Button>
  )
}

function AttachmentMenuItem({
  icon,
  label,
  onClick,
  onClose,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  onClose: () => void
}) {
  return (
    <Button
      variant="ghost"
      onClick={() => {
        onClick()
        onClose()
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        minHeight: 38,
        padding: '6px 10px',
        borderRadius: 10,
        color: 'var(--text)',
        fontSize: 'var(--font-size-body-sm)',
        fontWeight: 500,
        textAlign: 'left',
        justifyContent: 'flex-start',
        border: 'none',
        background: 'transparent',
      }}
      className="interactive-surface"
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--gold)',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
    </Button>
  )
}
