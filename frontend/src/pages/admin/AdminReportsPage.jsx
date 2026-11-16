import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'

const statusColour = {
  open:      'bg-red-100 text-red-700',
  resolved:  'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-500',
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState([])
  const [statusFilter, setStatusFilter] = useState('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  // Modal
  const [modal, setModal] = useState(null) // { report, type: 'resolve' | 'dismiss' }
  const [adminNote, setAdminNote] = useState('')
  const [modalError, setModalError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = () => {
    setLoading(true)
    const params = statusFilter ? { status: statusFilter } : {}
    api.get('/reports/admin/', { params })
      .then(({ data }) => setReports(data))
      .catch(() => setError('Failed to load reports.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [statusFilter])

  const openModal = (report, type) => {
    setModal({ report, type })
    setAdminNote('')
    setModalError('')
    setActionMsg('')
  }

  const closeModal = () => { setModal(null); setAdminNote('') }

  const doAction = async () => {
    setActionLoading(true)
    try {
      const url = modal.type === 'resolve'
        ? `/reports/admin/${modal.report.id}/resolve/`
        : `/reports/admin/${modal.report.id}/dismiss/`
      await api.post(url, { admin_note: adminNote })
      setActionMsg(`Report #${modal.report.id} ${modal.type === 'resolve' ? 'resolved' : 'dismissed'}.`)
      closeModal()
      load()
    } catch (err) {
      setModalError(err.response?.data?.detail || 'Action failed.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports &amp; Complaints</h1>
        <Link to="/admin/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
      </div>

      <div className="flex gap-2 mb-6">
        {['open', 'resolved', 'dismissed', ''].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {actionMsg && <div className="mb-4"><Alert type="success" message={actionMsg} /></div>}
      <Alert type="error" message={error} />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : reports.length === 0 ? (
        <p className="text-center text-gray-400 py-20">No reports found.</p>
      ) : (
        <div className="space-y-4">
          {reports.map(r => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-400">#{r.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColour[r.status]}`}>{r.status}</span>
                    <span className="text-xs text-gray-400 capitalize">{r.report_type}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{r.reason}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                    <span>By: <span className="text-gray-600">{r.reporter_email}</span></span>
                    {r.reported_listing_id && <span>Listing ID: <span className="text-gray-600">#{r.reported_listing_id}</span></span>}
                    {r.reported_user_email && <span>Reported user: <span className="text-gray-600">{r.reported_user_email}</span></span>}
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.admin_note && (
                    <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                      Admin note: {r.admin_note}
                    </p>
                  )}
                </div>
                {r.status === 'open' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openModal(r, 'resolve')} className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700">Resolve</button>
                    <button onClick={() => openModal(r, 'dismiss')} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200">Dismiss</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-1 capitalize">
              {modal.type} Report #{modal.report.id}
            </h2>
            <p className="text-sm text-gray-500 mb-4">Add an optional note about the decision.</p>
            <textarea
              rows={3}
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="Admin note (optional)..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {modalError && <p className="text-xs text-red-600 mt-1">{modalError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={closeModal} className="flex-1 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={doAction}
                disabled={actionLoading}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 ${modal.type === 'resolve' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'}`}
              >
                {actionLoading ? '...' : modal.type === 'resolve' ? 'Resolve' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
