import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import StatusBadge from '../../components/ui/StatusBadge'

const STATUS_TABS = [
  { label: 'All',           value: '' },
  { label: 'Live',          value: 'published' },
  { label: 'Pending',       value: 'pending_review' },
  { label: 'Proof Needed',  value: 'proof_requested' },
  { label: 'Under Review',  value: 'under_review' },
  { label: 'Rejected',      value: 'rejected' },
  { label: 'Sold/Rented',   value: 'sold' },
  { label: 'Hidden',        value: 'hidden' },
]

export default function SellerListingsPage() {
  const [listings, setListings]   = useState([])
  const [statusFilter, setStatus] = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  const load = (s) => {
    setLoading(true); setError('')
    const params = s ? { status: s } : {}
    api.get('/listings/my/', { params })
      .then(({ data }) => setListings(data))
      .catch(() => setError('Failed to load listings.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(statusFilter) }, [statusFilter])

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">My Listings</h1>
            <p className="text-sm text-gray-400 mt-0.5">{listings.length} listings found</p>
          </div>
          <div className="flex gap-3">
            <Link to="/seller/dashboard" className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Dashboard
            </Link>
            <Link to="/seller/listings/new"
              className="flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm shadow-md shadow-blue-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              New Listing
            </Link>
          </div>
        </div>

        {/* Status tabs — vehicle marketplace style */}
        <div className="flex gap-2 flex-wrap mb-6 bg-white rounded-2xl p-2 border border-gray-100 shadow-sm overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button key={tab.value} onClick={() => setStatus(tab.value)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === tab.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 mb-5">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-24"><Spinner size="lg" /></div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-20">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🏠</div>
            <p className="text-lg font-bold text-gray-700 mb-1">No listings here</p>
            <p className="text-sm text-gray-400 mb-5">Create your first listing to get started.</p>
            <Link to="/seller/listings/new" className="bg-blue-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 inline-block">
              Create Listing
            </Link>
          </div>
        ) : (
          /* Card grid — vehicle marketplace style */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map(l => (
              <div key={l.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5">

                {/* Image */}
                <div className="relative h-44 bg-gray-100 overflow-hidden">
                  {l.images?.[0] ? (
                    <img src={l.images[0].image} alt={l.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200 text-4xl">🏠</div>
                  )}
                  {/* Status badge top-left */}
                  <div className="absolute top-2.5 left-2.5">
                    <StatusBadge status={l.status} />
                  </div>
                  {/* Price top-right */}
                  <span className="absolute top-2.5 right-2.5 bg-gray-900/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    ${Number(l.price).toLocaleString()}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-0.5">{l.category_name}</p>
                  <h3 className="font-bold text-gray-900 text-sm truncate mb-1">{l.title}</h3>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="truncate">{l.location}</span>
                  </div>

                  {/* Proof deadline warning */}
                  {l.status === 'proof_requested' && l.proof_deadline && (
                    <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-1.5 mb-3 text-xs text-orange-700 font-medium">
                      ⏰ Proof due: {new Date(l.proof_deadline).toLocaleDateString()}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link to={`/seller/listings/${l.id}`}
                      className="flex-1 text-center py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors">
                      Manage
                    </Link>
                    {l.status === 'published' && (
                      <Link to={`/listings/${l.id}`}
                        className="flex-1 text-center py-2 border-2 border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:border-blue-300 hover:text-blue-600 transition-colors">
                        View Live
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
