import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  // Disable/enable modal
  const [modal, setModal] = useState(null) // { user, type: 'disable' | 'enable' }
  const [reason, setReason] = useState('')
  const [modalError, setModalError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = () => {
    setLoading(true)
    const params = roleFilter ? { role: roleFilter } : {}
    api.get('/users/admin/users/', { params })
      .then(({ data }) => setUsers(data))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [roleFilter])

  const openModal = (user, type) => {
    setModal({ user, type })
    setReason('')
    setModalError('')
    setActionMsg('')
  }

  const closeModal = () => { setModal(null); setReason(''); setModalError('') }

  const doAction = async () => {
    if (modal.type === 'disable' && !reason.trim()) {
      setModalError('A reason is required.')
      return
    }
    setActionLoading(true)
    try {
      const url = modal.type === 'disable'
        ? `/users/admin/users/${modal.user.id}/disable/`
        : `/users/admin/users/${modal.user.id}/enable/`
      const body = modal.type === 'disable' ? { reason } : {}
      await api.post(url, body)
      setActionMsg(`Account ${modal.type === 'disable' ? 'disabled' : 're-enabled'} successfully.`)
      closeModal()
      load()
    } catch (err) {
      setModalError(err.response?.data?.detail || 'Action failed.')
    } finally {
      setActionLoading(false)
    }
  }

  const roleBadge = (role) => {
    const c = { buyer: 'bg-blue-100 text-blue-700', seller: 'bg-purple-100 text-purple-700', admin: 'bg-gray-200 text-gray-700' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c[role] ?? ''}`}>{role}</span>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Link to="/admin/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
      </div>

      {/* Role filter */}
      <div className="flex gap-2 mb-6">
        {['', 'buyer', 'seller', 'admin'].map(r => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              roleFilter === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {r || 'All'}
          </button>
        ))}
      </div>

      {actionMsg && <Alert type="success" message={actionMsg} />}
      <Alert type="error" message={error} />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${u.is_disabled ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.first_name} {u.last_name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">{roleBadge(u.role)}</td>
                  <td className="px-4 py-3">
                    {u.is_disabled
                      ? <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Disabled</span>
                      : <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {u.role !== 'admin' && (
                      u.is_disabled
                        ? <button onClick={() => openModal(u, 'enable')} className="text-green-600 hover:underline text-xs font-medium">Enable</button>
                        : <button onClick={() => openModal(u, 'disable')} className="text-red-600 hover:underline text-xs font-medium">Disable</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-1">
              {modal.type === 'disable' ? 'Disable Account' : 'Re-enable Account'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {modal.type === 'disable'
                ? `This will hide all of ${modal.user.first_name}'s listings and prevent them from logging in.`
                : `This will re-enable ${modal.user.first_name}'s account and restore their published listings.`
              }
            </p>
            {modal.type === 'disable' && (
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Reason for disabling..."
                className={`w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${modalError ? 'border-red-400' : 'border-gray-300'}`}
              />
            )}
            {modalError && <p className="text-xs text-red-600 mt-1">{modalError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={closeModal} className="flex-1 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={doAction}
                disabled={actionLoading}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors ${modal.type === 'disable' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {actionLoading ? '...' : modal.type === 'disable' ? 'Disable' : 'Re-enable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
