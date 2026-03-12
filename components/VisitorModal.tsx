'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

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

// ─── Name generator ──────────────────────────────────────────────────────────

const ADJECTIVES = [
  'Curious', 'Happy', 'Sleepy', 'Bouncy', 'Fuzzy', 'Sneaky', 'Brave', 'Gentle',
  'Silly', 'Wise', 'Cozy', 'Fluffy', 'Nimble', 'Quirky', 'Dapper', 'Jolly',
  'Peppy', 'Witty', 'Zesty', 'Perky', 'Chipper', 'Feisty', 'Lucky', 'Misty',
  'Noble', 'Plucky', 'Sunny', 'Tiny', 'Grumpy', 'Snazzy', 'Wobbly', 'Nifty',
]

const ANIMALS = [
  'Panda', 'Fox', 'Otter', 'Raccoon', 'Koala', 'Hedgehog', 'Bunny', 'Penguin',
  'Capybara', 'Axolotl', 'Quokka', 'Fennec', 'Meerkat', 'Sloth', 'Lemur',
  'Platypus', 'Narwhal', 'Wombat', 'Chinchilla', 'Tamarin', 'Loris', 'Margay',
  'Kinkajou', 'Mongoose', 'Wallaby', 'Numbat', 'Blobfish', 'Tapir', 'Okapi',
]

const ANIMAL_EMOJI: Record<string, string> = {
  Panda: '🐼', Fox: '🦊', Otter: '🦦', Raccoon: '🦝', Koala: '🐨',
  Hedgehog: '🦔', Bunny: '🐰', Penguin: '🐧', Capybara: '🐾', Axolotl: '🫧',
  Quokka: '🐹', Fennec: '🦊', Meerkat: '👀', Sloth: '🦥', Lemur: '🐒',
  Platypus: '🦆', Narwhal: '🦄', Wombat: '🐾', Chinchilla: '🐭', Tamarin: '🐒',
  Loris: '🌙', Margay: '🐱', Kinkajou: '🌿', Mongoose: '⚡', Wallaby: '🦘',
  Numbat: '🐾', Blobfish: '🐟', Tapir: '🌿', Okapi: '🦒',
}

function generateVisitorName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return `${adj}${animal}`
}

function getAnimalEmoji(name: string): string {
  for (const animal of ANIMALS) {
    if (name.endsWith(animal)) return ANIMAL_EMOJI[animal] ?? '🐾'
  }
  return '🐾'
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function VisitorModal() {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: 100, y: 100 })
  const [generatedName, setGeneratedName] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [returning, setReturning] = useState(false)
  const [browsingName, setBrowsingName] = useState<string | null>(null)
  const [browsingPos, setBrowsingPos] = useState({ x: -999, y: -999 })
  const inputRef = useRef<HTMLInputElement>(null)
  const mountTimeRef = useRef<number>(0)
  const visitorIdRef = useRef<number | null>(null)

  const recordAnonymous = useCallback(async () => {
    mountTimeRef.current = performance.now()
    const assigned = generateVisitorName()
    setGeneratedName(assigned)

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
        writeSession({ id: json.id, done: false })
      }
      if (json.returning) setReturning(true)
    } catch { /* fail silently */ }

    setVisible(true)
  }, [])

  useEffect(() => {
    const existing = readSession()
    if (existing) return
    recordAnonymous()
  }, [recordAnonymous])

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
        visitorIdRef.current = null
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
    if (id) writeSession({ id, done: true })
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
      writeSession({ id, done: true })
    }

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
      {/* ── Modal ── */}
      {visible && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, cursor: 'none' }}
          onMouseDown={e => { e.preventDefault(); inputRef.current?.focus() }}
          onClick={e => { e.preventDefault(); inputRef.current?.focus() }}
        >
          <div
            style={{
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
            {/* Arrow */}
            <div style={{
              position: 'absolute',
              top: -7,
              left: 22,
              width: 13,
              height: 13,
              background: '#2e3348',
              border: '1px solid rgba(129,140,248,0.4)',
              borderRight: 'none',
              borderBottom: 'none',
              transform: 'rotate(45deg)',
              zIndex: 1,
            }} />

            {/* Card */}
            <div style={{
              background: 'linear-gradient(145deg, #2e3348 0%, #272c3f 100%)',
              border: '1px solid rgba(129,140,248,0.3)',
              borderRadius: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(129,140,248,0.06) inset',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Accent top bar */}
              <div style={{
                height: 3,
                background: 'linear-gradient(90deg, #6366f1, #818cf8, #6366f1)',
                backgroundSize: '200% 100%',
              }} />

              {done ? (
                /* ── Success state ── */
                <div style={{ padding: '28px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{emoji}</div>
                  <p style={{ margin: 0, fontSize: 17, color: '#818cf8', fontWeight: 700, letterSpacing: '-0.01em' }}>
                    {returning ? `Welcome back, ${finalName}!` : `Welcome, ${finalName}!`}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#a8b2cc' }}>Enjoy exploring ✓</p>
                </div>
              ) : (
                /* ── Form state ── */
                <form onSubmit={handleSubmit} style={{ padding: '22px 24px 20px' }}>

                  {/* Header */}
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
                      👋 Welcome to my portfolio
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: '#a8b2cc' }}>
                      You've been assigned a visitor identity
                    </p>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 18 }} />

                  {/* Name badge section */}
                  <div style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    marginBottom: 16,
                  }}>
                    <p style={{ margin: '0 0 10px', fontSize: 11, color: '#a8b2cc', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
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
                        <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#818cf8', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                          {generatedName || '…'}
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#a8b2cc' }}>your visitor alias</p>
                      </div>
                    </div>
                  </div>

                  {/* Input section */}
                  <p style={{ margin: '0 0 8px', fontSize: 12, color: '#c4cde0' }}>
                    Would love to know your real name!
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="my name is…"
                      maxLength={40}
                      disabled={submitting}
                      autoComplete="off"
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid #454d66',
                        borderRadius: 10,
                        padding: '10px 14px',
                        fontSize: 13,
                        color: '#e2e8f0',
                        outline: 'none',
                        minWidth: 0,
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(129,140,248,0.8)' }}
                      onBlur={e => { e.target.style.borderColor = '#454d66' }}
                      onMouseMove={e => e.stopPropagation()}
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        background: name.trim()
                          ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                          : 'rgba(99,102,241,0.15)',
                        color: name.trim() ? '#fff' : '#818cf8',
                        border: '1px solid rgba(99,102,241,0.45)',
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

                  <p style={{ margin: 0, fontSize: 11, color: '#a8b2cc', textAlign: 'center', letterSpacing: '0.02em' }}>
                    Press <kbd style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid #454d66',
                      borderRadius: 4,
                      padding: '1px 5px',
                      fontSize: 10,
                      color: '#a8b2cc',
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
            background: 'linear-gradient(135deg, #2e3348, #272c3f)',
            border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: 24,
            padding: '5px 14px 5px 9px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(99,102,241,0.06) inset',
            backdropFilter: 'blur(12px)',
            opacity: 0.92,
          }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>
              {getAnimalEmoji(browsingName)}
            </span>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#818cf8',
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
