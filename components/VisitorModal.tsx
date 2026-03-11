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

// ─── Component ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'portfolio_visitor'
const MODAL_W = 380
const MODAL_H = 160
const CURSOR_OFFSET_X = 20
const CURSOR_OFFSET_Y = 16

export default function VisitorModal() {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: 100, y: 100 })
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [returning, setReturning] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check sessionStorage on mount
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(STORAGE_KEY)) {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  // Dev-only: Ctrl+Shift+V resets the modal
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* */ }
        setName('')
        setDone(false)
        setSubmitting(false)
        setVisible(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Keep focus locked on input — refocus any time it strays
  useEffect(() => {
    if (!visible || done) return

    const refocus = () => {
      // Small timeout so the browser finishes processing the blur event first
      setTimeout(() => inputRef.current?.focus(), 0)
    }

    const input = inputRef.current
    input?.focus()
    input?.addEventListener('blur', refocus)
    return () => input?.removeEventListener('blur', refocus)
  }, [visible, done])

  // Block Tab / Escape so focus can't be moved away via keyboard
  useEffect(() => {
    if (!visible || done) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Escape') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [visible, done])

  // Follow the cursor
  const handleMouseMove = useCallback((e: MouseEvent) => {
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
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [visible, done, handleMouseMove])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSubmitting(true)

    const ua = navigator.userAgent
    const visitorData = {
      name: trimmed,
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
    }

    try {
      const res = await fetch('/api/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitorData),
      })
      const json = await res.json()
      if (json.returning) setReturning(true)
    } catch {
      // fail silently
    }

    try {
      sessionStorage.setItem(STORAGE_KEY, trimmed)
    } catch { /* private browsing */ }

    setDone(true)
    setTimeout(() => setVisible(false), 1400)
  }

  if (!visible) return null

  return (
    // Full-screen transparent overlay — blocks all clicks outside the modal
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        cursor: 'none',
      }}
      // Swallow all pointer events so nothing behind is clickable
      onMouseDown={e => { e.preventDefault(); inputRef.current?.focus() }}
      onClick={e => { e.preventDefault(); inputRef.current?.focus() }}
    >
      {/* Floating modal card */}
      <div
        style={{
          position: 'absolute',
          left: pos.x,
          top: pos.y,
          width: MODAL_W,
          pointerEvents: 'auto',
          transition: 'opacity 0.35s ease',
          opacity: done ? 0 : 1,
        }}
        // Stop mouse events from bubbling to the backdrop
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        {/* Tooltip arrow */}
        <div
          style={{
            position: 'absolute',
            top: -7,
            left: 18,
            width: 13,
            height: 13,
            background: 'var(--color-surface, #1e1e1e)',
            border: '1px solid var(--color-border, #333)',
            borderRight: 'none',
            borderBottom: 'none',
            transform: 'rotate(45deg)',
            zIndex: 1,
          }}
        />

        <div
          style={{
            background: 'var(--color-surface, #1e1e1e)',
            border: '1px solid var(--color-border, #333)',
            borderRadius: 12,
            padding: '18px 20px 20px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
          }}
        >
          {done ? (
            <p style={{ margin: 0, fontSize: 15, color: 'var(--color-accent, #7c6af7)', fontWeight: 700, textAlign: 'center' }}>
              {returning ? `Welcome back, ${name}! ✓` : `Welcome, ${name}! ✓`}
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--color-text, #eee)' }}>
                👋 Welcome to my portfolio
              </p>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--color-muted, #888)', lineHeight: 1.5 }}>
                Drop your name or initials to continue exploring.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name or initials…"
                  maxLength={40}
                  disabled={submitting}
                  autoComplete="off"
                  style={{
                    flex: 1,
                    background: 'var(--color-bg, #111)',
                    border: '1px solid var(--color-border, #444)',
                    borderRadius: 8,
                    padding: '9px 12px',
                    fontSize: 13,
                    color: 'var(--color-text, #eee)',
                    outline: 'none',
                    minWidth: 0,
                  }}
                  onMouseMove={e => e.stopPropagation()}
                />
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  style={{
                    background: 'var(--color-accent, #7c6af7)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '9px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer',
                    opacity: submitting || !name.trim() ? 0.45 : 1,
                    whiteSpace: 'nowrap',
                    transition: 'opacity 0.2s',
                  }}
                >
                  {submitting ? '…' : 'Enter →'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
