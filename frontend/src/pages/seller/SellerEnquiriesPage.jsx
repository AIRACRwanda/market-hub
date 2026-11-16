import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import EnquiryStatusBadge from '../../components/ui/EnquiryStatusBadge'

const STATUSES = ['', 'new', 'responded', 'viewing_requested', 'closed']

export default function SellerEnquiriesPage() {
  const [enquiries, setEnquiries]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get('status') || ''

  useEffect(() => {
    setLoading(true)
    const params = statusFilter ? { status: statusFilter } : {}
    api.get('/enquiries/seller/', { params })
      .then(({ data }) => setEnquiries(data))
      .catch(() => setError('Failed to load enquiries.'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  const setStatus = (s) => {
    const next = new URLSearchParams(searchParams)
    if (s) next.set('status', s)
    else next.delete('status')
    setSearchParams(next)
  }

  const unread = enquiries.filter(e => e.status === 'new').length

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
          {unread > 0 && (
            <p className="text-sm text-blue-600 font-medium mt-0.5">
              {unread} new enquir{unread === 1 ? 'y' : 'ies'} waiting for your reply
            </p>
          )}
        </div>
        <Link to="/seller/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
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
      ) : enquiries.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium mb-2">No enquiries yet</p>
          <p className="text-sm">When buyers send you messages, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map(e => (
            <Link
              key={e.id}
              to={`/seller/enquiries/${e.id}`}
              className={`block border rounded-2xl p-5 hover:shadow-md transition-shadow ${
                e.status === 'new'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{e.listing_title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">📍 {e.listing_location}</p>
                  {e.subject && (
                    <p className="text-sm text-gray-500 mt-1 truncate">{e.subject}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    From: <span className={`font-medium ${e.status === 'new' ? 'text-blue-700' : 'text-gray-600'}`}>
                      {e.buyer_name}
                    </span>
                    <span className="mx-2">·</span>
                    {e.messages?.length ?? 0} message{e.messages?.length !== 1 ? 's' : ''}
                    {e.viewing_requested && <span className="ml-2 text-purple-600">· 🗓 Viewing requested</span>}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <EnquiryStatusBadge status={e.status} />
                  <span className="text-xs text-gray-400">
                    {new Date(e.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
