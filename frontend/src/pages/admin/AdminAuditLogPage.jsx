import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'

const ACTION_LABELS = {
  listing_approved:  { label: 'Approved',         colour: 'bg-green-100 text-green-700' },
  listing_rejected:  { label: 'Rejected',         colour: 'bg-red-100 text-red-700' },
  proof_requested:   { label: 'Proof Requested',  colour: 'bg-orange-100 text-orange-700' },
  proof_rejected:    { label: 'Proof Rejected',   colour: 'bg-red-100 text-red-700' },
  listing_removed:   { label: 'Removed',          colour: 'bg-gray-200 text-gray-600' },
  account_disabled:  { label: 'Acct Disabled',    colour: 'bg-red-100 text-red-700' },
  account_enabled:   { label: 'Acct Enabled',     colour: 'bg-green-100 text-green-700' },
  report_resolved:   { label: 'Report Resolved',  colour: 'bg-blue-100 text-blue-700' },
  report_dismissed:  { label: 'Report Dismissed', colour: 'bg-gray-100 text-gray-500' },
}

export default function AdminAuditLogPage() {
  const [entries, setEntries] = useState([])
  const [actionFilter, setActionFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = { limit: 100 }
    if (actionFilter) params.action = actionFilter
    api.get('/audit-log/', { params })
      .then(({ data }) => setEntries(data))
      .catch(() => setError('Failed to load audit log.'))
      .finally(() => setLoading(false))
  }, [actionFilter])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <Link to="/admin/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
      </div>

      {/* Action filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setActionFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${!actionFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
        >
          All
        </button>
        {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setActionFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${actionFilter === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <Alert type="error" message={error} />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : entries.length === 0 ? (
        <p className="text-center text-gray-400 py-20">No audit log entries found.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Target</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Listing</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Note</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map(e => {
                const meta = ACTION_LABELS[e.action] ?? { label: e.action, colour: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${meta.colour}`}>{meta.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{e.admin_email}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{e.target_user_email || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                      {e.target_listing_title
                        ? <Link to={`/admin/listings/${e.target_listing_id}`} className="text-blue-600 hover:underline">{e.target_listing_title}</Link>
                        : '—'
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{e.note || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
