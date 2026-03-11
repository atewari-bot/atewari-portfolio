'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminActions() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  function openModal() {
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    setError(''); setSuccess('')
    setShowModal(true)
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')

    if (newPw !== confirmPw) {
      setError('New passwords do not match')
      return
    }
    if (newPw.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to change password')
      } else {
        setSuccess('Password changed successfully')
        setTimeout(() => setShowModal(false), 1500)
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={openModal}
          className="px-4 py-2 text-sm font-medium bg-surface border border-border rounded-lg text-text hover:bg-surface-hover transition-colors"
        >
          Change Password
        </button>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium bg-surface border border-border rounded-lg text-muted hover:text-text hover:bg-surface-hover transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Change Password Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-surface border border-border rounded-card w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text">Change Password</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-text text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Current password</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">New password</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  required
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent transition-colors"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  required
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}
              {success && <p className="text-green-400 text-sm">{success}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-medium border border-border rounded-lg text-muted hover:text-text hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 text-sm font-semibold bg-accent hover:opacity-90 disabled:opacity-50 text-white rounded-lg transition-opacity"
                >
                  {loading ? 'Saving…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
