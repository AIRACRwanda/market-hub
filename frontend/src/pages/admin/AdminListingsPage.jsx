import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import StatusBadge from '../../components/ui/StatusBadge'

const STATUSES = [
  '', 'pending_review', 'proof_requested', 'under_review',
  'published', 'rejected', 'permanently_rejected',
  'expired', 'sold', 'rented', 'removed', 'hidden',
]

export default function AdminListingsPage() {
  const [listings, setListings] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending_review')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = (s) => {
    setLoading(true)
    setError('')
    const params = s ? { status: s } : {}
    api.get('/listings/admin/', { params })
      .then(({ data }) => setListings(data))
      .catch(() => setError('Failed to load listings.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(statusFilter) }, [statusFilter])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Listings</h1>
        <Link to="/admin/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              statusFilter === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <Alert type="error" message={error} />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : listings.length === 0 ? (
        <p className="text-center text-gray-400 py-20">No listings found for this status.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Listing</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Seller</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Attempts</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map(l => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{l.title}</td>
                  <td className="px-4 py-3 text-gray-500">{l.seller_email}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{l.listing_type}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{l.proof_attempts}/3</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(l.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/listings/${l.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
