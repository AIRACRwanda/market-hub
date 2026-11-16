import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import EnquiryStatusBadge from '../../components/ui/EnquiryStatusBadge'
import EnquiryThread from '../../components/ui/EnquiryThread'

export default function SellerEnquiryDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()

  const [enquiry, setEnquiry]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [reply, setReply]           = useState('')
  const [sending, setSending]       = useState(false)
  const [replyError, setReplyError] = useState('')
  const [actionMsg, setActionMsg]   = useState('')

  const load = () => {
    api.get(`/enquiries/seller/${id}/`)
      .then(({ data }) => setEnquiry(data))
      .catch(() => setError('Enquiry not found.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const sendReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    setReplyError('')
    try {
      await api.post(`/enquiries/seller/${id}/reply/`, { message: reply })
      setReply('')
      load()
    } catch (err) {
      setReplyError(err.response?.data?.detail || 'Failed to send reply.')
    } finally {
      setSending(false)
    }
  }

  const closeEnquiry = async () => {
    try {
      await api.post(`/enquiries/seller/${id}/close/`)
      setActionMsg('Enquiry closed.')
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to close enquiry.')
    }
  }

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>
  if (error && !enquiry) return <div className="max-w-2xl mx-auto px-4 py-20"><Alert type="error" message={error} /></div>
  if (!enquiry) return null

  const isClosed = enquiry.status === 'closed'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/seller/enquiries" className="text-sm text-blue-600 hover:underline">← All Enquiries</Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-bold text-gray-900 text-lg">{enquiry.listing_title}</h1>
              <p className="text-xs text-gray-400 mt-0.5">📍 {enquiry.listing_location}</p>
              {enquiry.subject && <p className="text-sm text-gray-500 mt-1">{enquiry.subject}</p>}
              <p className="text-xs text-gray-400 mt-2">
                From: <span className="text-gray-700 font-medium">{enquiry.buyer_name}</span>
                <span className="text-gray-400"> · {enquiry.buyer_email}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <EnquiryStatusBadge status={enquiry.status} />
              <Link to={`/listings/${enquiry.listing}`} className="text-xs text-blue-600 hover:underline">
                View listing →
              </Link>
            </div>
          </div>

          {enquiry.viewing_requested && enquiry.viewing_date && (
            <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 text-sm text-purple-800">
              🗓 Viewing requested for <strong>{new Date(enquiry.viewing_date).toLocaleString()}</strong>
            </div>
          )}
        </div>

        {/* Thread */}
        <div className="p-5 max-h-[480px] overflow-y-auto bg-gray-50">
          <EnquiryThread messages={enquiry.messages} myId={user?.id} />
        </div>

        {/* Reply box */}
        {!isClosed ? (
          <div className="p-5 border-t border-gray-100 space-y-3">
            {actionMsg && <Alert type="success" message={actionMsg} />}
            {replyError && <Alert type="error" message={replyError} />}

            <form onSubmit={sendReply} className="flex gap-2">
              <textarea
                rows={2}
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(e) } }}
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 self-end"
              >
                {sending ? '...' : 'Reply'}
              </button>
            </form>

            <div className="flex justify-end">
              <button
                onClick={closeEnquiry}
                className="text-sm text-gray-400 font-medium hover:text-red-500 hover:underline"
              >
                Close enquiry
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 border-t border-gray-100 text-center">
            {actionMsg && <Alert type="success" message={actionMsg} />}
            <p className="text-sm text-gray-400">This enquiry is closed.</p>
          </div>
        )}
      </div>
    </div>
  )
}
