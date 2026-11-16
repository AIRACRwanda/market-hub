import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import EnquiryStatusBadge from '../../components/ui/EnquiryStatusBadge'

const TABS = [
  { label: 'All',               value: '' },
  { label: 'New',               value: 'new' },
  { label: 'Responded',         value: 'responded' },
  { label: 'Viewing Requested', value: 'viewing_requested' },
  { label: 'Closed',            value: 'closed' },
]

export default function BuyerEnquiriesPage() {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get('status') || ''

  useEffect(() => {
    setLoading(true)
    const params = statusFilter ? { status: statusFilter } : {}
    api.get('/enquiries/buyer/', { params })
      .then(({ data }) => setEnquiries(data))
      .catch(() => setError('Failed to load enquiries.'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  const setStatus = (s) => {
    const next = new URLSearchParams(searchParams)
    if (s) next.set('status', s); else next.delete('status')
    setSearchParams(next)
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">My Enquiries</h1>
            <p className="text-sm text-gray-400 mt-0.5">{enquiries.length} total enquiries</p>
          </div>
          <Link to="/listings"
            className="flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm shadow-md shadow-blue-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Browse Listings
          </Link>
        </div>

        {/* Tab pills */}
        <div className="flex gap-2 flex-wrap mb-6 bg-white rounded-2xl p-2 border border-gray-100 shadow-sm">
          {TABS.map(tab => (
            <button key={tab.value} onClick={() => setStatus(tab.value)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
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
        ) : enquiries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-20">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">💬</div>
            <p className="text-lg font-bold text-gray-700 mb-1">No enquiries yet</p>
            <p className="text-sm text-gray-400 mb-5">Browse listings and send an enquiry to start a conversation.</p>
            <Link to="/listings" className="bg-blue-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 inline-block">
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {enquiries.map(e => (
              <Link key={e.id} to={`/buyer/enquiries/${e.id}`}
                className="flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all hover:border-blue-100">

                {/* Listing thumbnail */}
                <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">🏠</div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{e.listing_title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {e.listing_location}
                  </p>
                  {e.subject && <p className="text-sm text-gray-500 mt-1 truncate">{e.subject}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>Seller: <span className="text-gray-600 font-medium">{e.seller_name}</span></span>
                    <span>·</span>
                    <span>{e.messages?.length ?? 0} message{e.messages?.length !== 1 ? 's' : ''}</span>
                    {e.viewing_requested && <span className="text-purple-600 font-medium">· 🗓 Viewing</span>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <EnquiryStatusBadge status={e.status} />
                  <span className="text-xs text-gray-400">{new Date(e.updated_at).toLocaleDateString()}</span>
                  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
