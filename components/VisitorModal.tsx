'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { generateVisitorName, getAnimalEmoji } from '@/lib/visitorNames'
import PusherJS from 'pusher-js'
import type { PresenceChannel } from 'pusher-js'

// ─── Browser helpers ────────────────────────────────────────────────────────

function parseBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return 'Edge'
  if (/OPR\/|Opera/.test(ua)) return 'Opera'
  if (/Chrome\//.test(ua)) return 'Chrome'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari'
  if (/MSIE|Trident/.test(ua)) return 'Internet Explorer'
  return 'Unknown'
}

function parseOS(ua: string): string {
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11'
  if (/Windows/.test(ua)) return 'Windows'
  if (/Mac OS X/.test(ua)) return 'macOS'
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS'
  if (/Android/.test(ua)) return 'Android'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Unknown'
}

function getDeviceType(): string {
  const touch = navigator.maxTouchPoints > 0
  if (!touch) return 'desktop'
  return screen.width >= 768 ? 'tablet' : 'mobile'
}

function buildFingerprint(): string {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency ?? '',
    (navigator as any).deviceMemory ?? '',
  ]
  let hash = 5381
  for (const char of parts.join('|')) {
    hash = (hash * 33) ^ char.charCodeAt(0)
  }
  return (hash >>> 0).toString(16)
}

// ─── Session helpers ─────────────────────────────────────────────────────────

const SESSION_KEY = 'pv_session'
const MODAL_W = 420
const MODAL_H = 280
const CURSOR_OFFSET_X = 20
const CURSOR_OFFSET_Y = 16
const TOOLTIP_W = 200

interface SessionEntry {
  id: number
  done: boolean
  name?: string
  emoji?: string
}

function readSession(): SessionEntry | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SessionEntry
  } catch {
    return null
  }
}

function writeSession(entry: SessionEntry) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(entry)) } catch { /* private browsing */ }
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface RemoteCursor {
  id: string
  name: string
  emoji: string
  x: number   // 0–1 fraction of sender's viewport width
  y: number   // 0–1 fraction of sender's viewport height
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VisitorModal() {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: 100, y: 100 })
  const [isMobile, setIsMobile] = useState(false)
  const [generatedName, setGeneratedName] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [returning, setReturning] = useState(false)
  const [browsingName, setBrowsingName] = useState<string | null>(null)
  const [browsingPos, setBrowsingPos] = useState({ x: -999, y: -999 })
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map())
  const [visitorId, setVisitorId] = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const mountTimeRef = useRef<number>(0)
  const visitorIdRef = useRef<number | null>(null)
  const pusherRef = useRef<PusherJS | null>(null)
  const channelRef = useRef<PresenceChannel | null>(null)
  const lastBroadcastRef = useRef<number>(0)
  // Always up-to-date name/emoji refs for use inside event handlers
  const displayNameRef = useRef<string>('')
  const emojiRef = useRef<string>('👤')

  // ── Pusher connection ──────────────────────────────────────────────────────

  const connectToPusher = useCallback((id: number) => {
    if (pusherRef.current) return
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    if (!key || !cluster) return  // not configured — feature disabled

    const pusher = new PusherJS(key, {
      cluster,
      channelAuthorization: {
        endpoint: '/api/pusher/auth',
        transport: 'ajax',
        // customHandler lets us send JSON (including user_info) to the auth endpoint
        customHandler: async (params, callback) => {
          try {
            const res = await fetch('/api/pusher/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                socket_id: params.socketId,
                channel_name: params.channelName,
                user_id: String(id),
                user_info: { name: displayNameRef.current, emoji: emojiRef.current },
              }),
            })
            const data = await res.json()
            callback(null, data)
          } catch (e) {
            callback(new Error('Pusher auth failed'), null)
          }
        },
      },
    })

    const channel = pusher.subscribe('presence-portfolio-cursors') as PresenceChannel

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[Pusher] ✅ Subscribed to presence channel, member count:', (channel as any).members?.count)
    })

    channel.bind('pusher:subscription_error', (err: unknown) => {
      console.error('[Pusher] ❌ Subscription failed:', err)
    })

    pusher.connection.bind('state_change', ({ current }: { current: string }) => {
      console.log('[Pusher] connection state →', current)
    })

    // Receive another visitor's cursor move
    channel.bind('client-cursor-moved', (data: {
      userId: string; name: string; emoji: string; x: number; y: number
    }) => {
      console.log('[Pusher] cursor event from', data.userId, data.name)
      if (data.userId === String(id)) return  // own echo — ignore
      setRemoteCursors(prev => {
        const next = new Map(prev)
        next.set(data.userId, {
          id: data.userId,
          name: data.name,
          emoji: data.emoji,
          x: data.x,
          y: data.y,
        })
        return next
      })
    })

    // Clean up stale cursor when visitor disconnects
    channel.bind('pusher:member_removed', (member: { id: string }) => {
      console.log('[Pusher] member removed:', member.id)
      setRemoteCursors(prev => {
        const next = new Map(prev)
        next.delete(String(member.id))
        return next
      })
    })

    pusherRef.current = pusher
    channelRef.current = channel
  }, [])

  // ── Broadcast own cursor ───────────────────────────────────────────────────

  const broadcastCursor = useCallback((e: MouseEvent) => {
    const now = Date.now()
    if (now - lastBroadcastRef.current < 50) return   // max ~20fps
    if (!channelRef.current) return
    lastBroadcastRef.current = now

    try {
      const ok = channelRef.current.trigger('client-cursor-moved', {
        userId: String(visitorIdRef.current),
        name: displayNameRef.current,
        emoji: emojiRef.current,
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      })
      if (!ok) console.warn('[Pusher] trigger returned false — channel not yet subscribed or client events disabled')
    } catch (err) { console.error('[Pusher] trigger error:', err) }
  }, [])

  // Start broadcasting once we have a visitor ID
  useEffect(() => {
    if (!visitorId) return
    window.addEventListener('mousemove', broadcastCursor)
    return () => window.removeEventListener('mousemove', broadcastCursor)
  }, [visitorId, broadcastCursor])

  // Keep displayNameRef in sync with browsingName (final submitted/generated name)
  useEffect(() => {
    if (browsingName) displayNameRef.current = browsingName
  }, [browsingName])

  // Cleanup Pusher on unmount
  useEffect(() => {
    return () => {
      channelRef.current?.unbind_all()
      pusherRef.current?.disconnect()
    }
  }, [])

  // ── Record visitor ─────────────────────────────────────────────────────────

  const recordAnonymous = useCallback(async () => {
    mountTimeRef.current = performance.now()
    const assigned = generateVisitorName()
    const assignedEmoji = getAnimalEmoji(assigned)
    setGeneratedName(assigned)
    displayNameRef.current = assigned
    emojiRef.current = assignedEmoji

    const ua = navigator.userAgent
    const payload = {
      name: assigned,
      userAgent: ua,
      browser: parseBrowser(ua),
      os: parseOS(ua),
      screenRes: `${screen.width}x${screen.height}`,
      colorDepth: `${screen.colorDepth}-bit`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack ?? 'unspecified',
      referrer: document.referrer || 'direct',
      fingerprint: buildFingerprint(),
      deviceType: getDeviceType(),
      pixelRatio: `${window.devicePixelRatio}x`,
    }

    try {
      const res = await fetch('/api/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.id) {
        visitorIdRef.current = json.id
        setVisitorId(json.id)
        writeSession({ id: json.id, done: false, name: assigned, emoji: assignedEmoji })
        connectToPusher(json.id)
      }
      if (json.returning) setReturning(true)
    } catch { /* fail silently */ }

    setVisible(true)
  }, [connectToPusher])

  // Detect mobile/touch so we can center the modal instead of cursor-following
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || navigator.maxTouchPoints > 0)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const existing = readSession()
    if (existing) {
      // Restore identity from session so Pusher broadcasts the correct name
      visitorIdRef.current = existing.id
      setVisitorId(existing.id)
      if (existing.name) {
        displayNameRef.current = existing.name
        emojiRef.current = existing.emoji ?? '👤'
        setGeneratedName(existing.name)
        setBrowsingName(existing.name)
      }
      connectToPusher(existing.id)
      return
    }
    recordAnonymous()
  }, [recordAnonymous, connectToPusher])

  // Dev-only: Ctrl+Shift+V resets
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        try { sessionStorage.removeItem(SESSION_KEY) } catch { /* */ }
        setName('')
        setGeneratedName('')
        setDone(false)
        setSubmitting(false)
        setVisible(false)
        setReturning(false)
        setBrowsingName(null)
        setVisitorId(null)
        setRemoteCursors(new Map())
        visitorIdRef.current = null
        channelRef.current?.unbind_all()
        pusherRef.current?.disconnect()
        pusherRef.current = null
        channelRef.current = null
        recordAnonymous()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [recordAnonymous])

  // Keep focus on input
  useEffect(() => {
    if (!visible || done) return
    const refocus = () => setTimeout(() => inputRef.current?.focus(), 0)
    const input = inputRef.current
    input?.focus()
    input?.addEventListener('blur', refocus)
    return () => input?.removeEventListener('blur', refocus)
  }, [visible, done])

  // Block Tab; Escape = skip
  useEffect(() => {
    if (!visible || done) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') { e.preventDefault(); inputRef.current?.focus() }
      if (e.key === 'Escape') { e.preventDefault(); skip() }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, done])

  // Cursor follow — modal
  const handleModalMouseMove = useCallback((e: MouseEvent) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    let x = e.clientX + CURSOR_OFFSET_X
    let y = e.clientY + CURSOR_OFFSET_Y
    x = Math.min(x, vw - MODAL_W - 8)
    y = Math.min(y, vh - MODAL_H - 8)
    x = Math.max(x, 8)
    y = Math.max(y, 8)
    setPos({ x, y })
  }, [])

  useEffect(() => {
    if (!visible || done) return
    window.addEventListener('mousemove', handleModalMouseMove)
    return () => window.removeEventListener('mousemove', handleModalMouseMove)
  }, [visible, done, handleModalMouseMove])

  // Cursor follow — browsing tooltip
  const handleBrowsingMouseMove = useCallback((e: MouseEvent) => {
    const vw = window.innerWidth
    let x = e.clientX + CURSOR_OFFSET_X
    let y = e.clientY + CURSOR_OFFSET_Y
    x = Math.min(x, vw - TOOLTIP_W - 8)
    y = Math.max(y, 8)
    setBrowsingPos({ x, y })
  }, [])

  useEffect(() => {
    if (!browsingName) return
    window.addEventListener('mousemove', handleBrowsingMouseMove)
    return () => window.removeEventListener('mousemove', handleBrowsingMouseMove)
  }, [browsingName, handleBrowsingMouseMove])

  function skip() {
    const id = visitorIdRef.current
    const skipEmoji = getAnimalEmoji(generatedName)
    if (id) writeSession({ id, done: true, name: generatedName, emoji: skipEmoji })
    setBrowsingName(generatedName)
    setVisible(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { skip(); return }
    setSubmitting(true)

    const id = visitorIdRef.current
    if (id) {
      try {
        await fetch('/api/visitor', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            name: trimmed,
            timeToSubmit: Math.round(performance.now() - mountTimeRef.current),
          }),
        })
      } catch { /* fail silently */ }
      const finalEmoji = getAnimalEmoji(generatedName)
      writeSession({ id, done: true, name: trimmed, emoji: finalEmoji })
    }

    // Update display name refs so Pusher broadcasts the real name going forward
    displayNameRef.current = trimmed
    emojiRef.current = getAnimalEmoji(generatedName)

    setDone(true)
    setTimeout(() => {
      setBrowsingName(trimmed)
      setVisible(false)
    }, 1600)
  }

  const finalName = name.trim() || generatedName
  const emoji = getAnimalEmoji(generatedName)

  return (
    <>
      {/* ── Remote cursors ── */}
      {Array.from(remoteCursors.values()).map(cursor => (
        <div
          key={cursor.id}
          style={{
            position: 'fixed',
            left: `${cursor.x * 100}vw`,
            top: `${cursor.y * 100}vh`,
            zIndex: 9997,
            pointerEvents: 'none',
            transition: 'left 60ms linear, top 60ms linear',
          }}
        >
          {/* Cursor arrow */}
          <svg
            width="14"
            height="18"
            viewBox="0 0 14 18"
            fill="none"
            style={{ display: 'block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}
          >
            <path
              d="M0 0L0 14L3.5 10.5L6.5 17L8.5 16L5.5 9.5L10 9.5Z"
              fill="#38bdf8"
              stroke="#0d1117"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          {/* Name badge */}
          <div style={{
            background: 'linear-gradient(135deg, #1a1f2e, #0d1117)',
            border: '1px solid rgba(56,189,248,0.3)',
            borderRadius: 20,
            padding: '3px 10px 3px 7px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            marginTop: 2,
            marginLeft: 6,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}>
            <span style={{ fontSize: 12, lineHeight: 1 }}>{cursor.emoji}</span>
            <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, letterSpacing: '-0.01em' }}>
              {cursor.name}
            </span>
          </div>
        </div>
      ))}

      {/* ── Modal ── */}
      {visible && (
        <div
          style={isMobile ? {
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
          } : {
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            cursor: 'none',
          }}
          onMouseDown={e => { if (!isMobile) { e.preventDefault(); inputRef.current?.focus() } }}
          onClick={e => { if (!isMobile) { e.preventDefault(); inputRef.current?.focus() } }}
        >
          <div
            style={isMobile ? {
              width: '100%',
              maxWidth: MODAL_W,
              pointerEvents: 'auto',
              transition: 'opacity 0.4s ease',
              opacity: done ? 0 : 1,
            } : {
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              width: MODAL_W,
              pointerEvents: 'auto',
              transition: 'opacity 0.4s ease',
              opacity: done ? 0 : 1,
            }}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            {/* Arrow — desktop only (cursor-follow indicator) */}
            {!isMobile && <div style={{
              position: 'absolute',
              top: -7,
              left: 22,
              width: 13,
              height: 13,
              background: '#1a1f2e',
              border: '1px solid rgba(56,189,248,0.25)',
              borderRight: 'none',
              borderBottom: 'none',
              transform: 'rotate(45deg)',
              zIndex: 1,
            }} />}

            {/* Card */}
            <div style={{
              background: 'linear-gradient(145deg, #1a1f2e 0%, #0d1117 100%)',
              border: '1px solid rgba(56,189,248,0.18)',
              borderRadius: 16,
              boxShadow: '0 25px 80px rgba(0,0,0,0.7), 0 0 40px rgba(14,165,233,0.08)',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Accent top bar */}
              <div style={{
                height: 3,
                background: 'linear-gradient(90deg, #0284c7, #38bdf8, #0284c7)',
                backgroundSize: '200% 100%',
              }} />

              {done ? (
                /* ── Success state ── */
                <div style={{ padding: '28px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{emoji}</div>
                  <p style={{ margin: 0, fontSize: 17, color: '#38bdf8', fontWeight: 700, letterSpacing: '-0.01em' }}>
                    {returning ? `Welcome back, ${finalName}!` : `Welcome, ${finalName}!`}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#8b949e' }}>Enjoy exploring ✓</p>
                </div>
              ) : (
                /* ── Form state ── */
                <form onSubmit={handleSubmit} style={{ padding: '22px 24px 20px' }}>

                  {/* Header */}
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: '#e6edf3', letterSpacing: '-0.01em' }}>
                      👋 Welcome to my portfolio
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: '#8b949e' }}>
                      You've been assigned a visitor identity
                    </p>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 18 }} />

                  {/* Name badge section */}
                  <div style={{
                    background: 'rgba(14,165,233,0.07)',
                    border: '1px solid rgba(56,189,248,0.15)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    marginBottom: 16,
                  }}>
                    <p style={{ margin: '0 0 10px', fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                      Hello!
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: 28,
                        lineHeight: 1,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                      }}>
                        {emoji}
                      </span>
                      <div>
                        <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                          {generatedName || '…'}
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#8b949e' }}>your visitor alias</p>
                      </div>
                    </div>
                  </div>

                  {/* Input section */}
                  <p style={{ margin: '0 0 8px', fontSize: 12, color: '#8b949e' }}>
                    What&apos;s your name or alias?
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="name or alias…"
                      maxLength={40}
                      disabled={submitting}
                      autoComplete="off"
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid #30363d',
                        borderRadius: 10,
                        padding: '10px 14px',
                        fontSize: 13,
                        color: '#e6edf3',
                        outline: 'none',
                        minWidth: 0,
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(56,189,248,0.7)' }}
                      onBlur={e => { e.target.style.borderColor = '#30363d' }}
                      onMouseMove={e => e.stopPropagation()}
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        background: name.trim()
                          ? 'linear-gradient(135deg, #0284c7, #38bdf8)'
                          : 'rgba(14,165,233,0.1)',
                        color: name.trim() ? '#fff' : '#38bdf8',
                        border: '1px solid rgba(56,189,248,0.35)',
                        borderRadius: 10,
                        padding: '10px 18px',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        opacity: submitting ? 0.5 : 1,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {submitting ? '…' : name.trim() ? 'Enter →' : 'Keep →'}
                    </button>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', marginBottom: 10 }} />

                  <p style={{ margin: 0, fontSize: 11, color: '#8b949e', textAlign: 'center', letterSpacing: '0.02em' }}>
                    Press <kbd style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid #30363d',
                      borderRadius: 4,
                      padding: '1px 5px',
                      fontSize: 10,
                      color: '#8b949e',
                      fontFamily: 'inherit',
                    }}>esc</kbd> to skip
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Browsing tooltip ── */}
      {browsingName && browsingPos.x > 0 && (
        <div style={{
          position: 'fixed',
          left: browsingPos.x,
          top: browsingPos.y,
          zIndex: 9998,
          pointerEvents: 'none',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: 'linear-gradient(135deg, #1a1f2e, #0d1117)',
            border: '1px solid rgba(56,189,248,0.3)',
            borderRadius: 24,
            padding: '5px 14px 5px 9px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(14,165,233,0.06) inset',
            backdropFilter: 'blur(12px)',
            opacity: 0.92,
          }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>
              {getAnimalEmoji(browsingName)}
            </span>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#38bdf8',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              {browsingName}
            </span>
          </div>
        </div>
      )}
    </>
  )
}
