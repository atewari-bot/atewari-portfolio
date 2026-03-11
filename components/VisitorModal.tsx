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
  // simple djb2 hash
  let hash = 5381
  for (const char of parts.join('|')) {
    hash = (hash * 33) ^ char.charCodeAt(0)
  }
  return (hash >>> 0).toString(16)
}

// ─── Component ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'portfolio_visitor'
const MODAL_W = 260
const MODAL_H = 130
const CURSOR_OFFSET_X = 18
const CURSOR_OFFSET_Y = 14

export default function VisitorModal() {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: 100, y: 100 })
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const posRef = useRef(pos)

  // Check localStorage on mount
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  // Focus input once visible
  useEffect(() => {
    if (visible && !done) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [visible, done])

  // Follow the cursor
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const vw = window.innerWidth
    const vh = window.innerHeight

    let x = e.clientX + CURSOR_OFFSET_X
    let y = e.clientY + CURSOR_OFFSET_Y

    // clamp so modal stays inside viewport
    x = Math.min(x, vw - MODAL_W - 8)
    y = Math.min(y, vh - MODAL_H - 8)
    x = Math.max(x, 8)
    y = Math.max(y, 8)

    posRef.current = { x, y }
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
      await fetch('/api/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitorData),
      })
    } catch {
      // fail silently — don't block UX
    }

    try {
      localStorage.setItem(STORAGE_KEY, trimmed)
    } catch { /* private browsing */ }

    setDone(true)
    setTimeout(() => setVisible(false), 1200)
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: MODAL_W,
        zIndex: 9999,
        pointerEvents: done ? 'none' : 'auto',
        transition: 'opacity 0.3s ease',
        opacity: done ? 0 : 1,
      }}
    >
      <div
        style={{
          background: 'var(--color-surface, #1e1e1e)',
          border: '1px solid var(--color-border, #333)',
          borderRadius: 10,
          padding: '12px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {done ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-accent, #7c6af7)', fontWeight: 600 }}>
            Welcome, {name}! ✓
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-muted, #888)', lineHeight: 1.4 }}>
              👋 Welcome! Drop your name or initials to explore the portfolio.
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Name or initials…"
                maxLength={40}
                disabled={submitting}
                style={{
                  flex: 1,
                  background: 'var(--color-bg, #111)',
                  border: '1px solid var(--color-border, #333)',
                  borderRadius: 6,
                  padding: '6px 8px',
                  fontSize: 12,
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
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer',
                  opacity: submitting || !name.trim() ? 0.5 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {submitting ? '…' : 'Enter →'}
              </button>
            </div>
          </form>
        )}
      </div>
      {/* small arrow pointing to cursor */}
      <div
        style={{
          position: 'absolute',
          top: -6,
          left: 14,
          width: 12,
          height: 12,
          background: 'var(--color-surface, #1e1e1e)',
          border: '1px solid var(--color-border, #333)',
          borderRight: 'none',
          borderBottom: 'none',
          transform: 'rotate(45deg)',
        }}
      />
    </div>
  )
}
