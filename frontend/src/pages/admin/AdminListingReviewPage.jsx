import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import StatusBadge from '../../components/ui/StatusBadge'

export default function AdminListingReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Modal state
  const [modal, setModal] = useState(null) // 'approve' | 'reject' | 'proof' | 'remove'
  const [inputText, setInputText] = useState('')
  const [inputError, setInputError] = useState('')

  const load = () => {
    setLoading(true)
    api.get(`/listings/admin/${id}/`)
      .then(({ data }) => setListing(data))
      .catch(() => setError('Listing not found.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const openModal = (type) => {
    setModal(type)
    setInputText('')
    setInputError('')
    setError('')
    setSuccess('')
  }

  const closeModal = () => { setModal(null); setInputText(''); setInputError('') }

  const doAction = async () => {
    if ((modal === 'reject' || modal === 'proof' || modal === 'remove') && !inputText.trim()) {
      setInputError('This field is required.')
      return
    }
    setActionLoading(true)
    setInputError('')
    try {
      const endpoints = {
        approve: [`/listings/admin/${id}/approve/`, {}],
        reject:  [`/listings/admin/${id}/reject/`,  { reason: inputText }],
        proof:   [`/listings/admin/${id}/request-proof/`, { message: inputText }],
        remove:  [`/listings/admin/${id}/remove/`,  { reason: inputText }],
      }
      const [url, body] = endpoints[modal]
      const { data } = await api.post(url, body)
      setSuccess(data.message)
      closeModal()
      load()
    } catch (err) {
      setInputError(err.response?.data?.detail || 'Action failed.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>
  if (!listing && error) return <div className="max-w-2xl mx-auto px-4 py-20"><Alert type="error" message={error} /></div>
  if (!listing) return null

  const canApprove  = ['pending_review', 'under_review'].includes(listing.status)
  const canReject   = ['pending_review', 'under_review'].includes(listing.status)
  const canProof    = ['pending_review', 'under_review'].includes(listing.status) && listing.proof_attempts < 3
  const canRemove   = listing.status === 'published'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <Link to="/admin/listings" className="text-sm text-blue-600 hover:underline">← All Listings</Link>
        <StatusBadge status={listing.status} />
      </div>

      <Alert type="success" message={success} />
      <Alert type="error" message={error} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {listing.images?.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {listing.images.map(img => (
                <img key={img.id} src={img.image} alt="" className="h-40 w-56 object-cover rounded-xl flex-shrink-0 border border-gray-200" />
              ))}
            </div>
          )}

          {/* Details */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h1 className="text-xl font-bold text-gray-900">{listing.title}</h1>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Category"  value={listing.category_name} />
              <Detail label="Type"      value={listing.listing_type === 'sale' ? 'For Sale' : 'For Rent'} />
              <Detail label="Price"     value={`$${Number(listing.price).toLocaleString()}`} />
              <Detail label="Location"  value={listing.location} />
              <Detail label="Seller"    value={listing.seller_email} />
              <Detail label="Attempts"  value={`${listing.proof_attempts} / 3`} />
            </div>
            {listing.availability && <Detail label="Availability" value={listing.availability} />}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">{listing.description}</p>
            </div>
            {listing.admin_note && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-orange-700 mb-1">Admin Proof Request Note</p>
                <p className="text-sm text-orange-800">{listing.admin_note}</p>
              </div>
            )}
            {listing.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason</p>
                <p className="text-sm text-red-800">{listing.rejection_reason}</p>
              </div>
            )}
          </div>

          {/* Proof submissions */}
          {listing.proofs?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="font-semibold text-gray-900 mb-4">Proof Submissions</p>
              {listing.proofs.map(proof => (
                <div key={proof.id} className="border border-gray-100 rounded-xl p-4 mb-3">
                  <p className="text-xs text-gray-400 mb-2">Attempt #{proof.attempt_number} · {new Date(proof.submitted_at).toLocaleString()}</p>
                  <img src={proof.image} alt="Proof" className="h-40 rounded-lg object-cover border border-gray-200 mb-2" />
                  {proof.document && (
                    <a href={proof.document} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                      View Document
                    </a>
                  )}
                  {proof.seller_note && <p className="text-sm text-gray-600 mt-2">{proof.seller_note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action panel */}
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <p className="font-semibold text-gray-900 mb-4">Moderation Actions</p>
            <div className="space-y-3">
              {canApprove && (
                <ActionBtn colour="green" onClick={() => openModal('approve')}>
                  ✓ Approve &amp; Publish
                </ActionBtn>
              )}
              {canProof && (
                <ActionBtn colour="orange" onClick={() => openModal('proof')}>
                  Request Proof
                </ActionBtn>
              )}
              {canReject && (
                <ActionBtn colour="red" onClick={() => openModal('reject')}>
                  Reject Listing
                </ActionBtn>
              )}
              {canRemove && (
                <ActionBtn colour="gray" onClick={() => openModal('remove')}>
                  Remove Listing
                </ActionBtn>
              )}
              {!canApprove && !canProof && !canReject && !canRemove && (
                <p className="text-sm text-gray-400">No actions available for status <strong>{listing.status}</strong>.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-1 capitalize">
              {modal === 'proof' ? 'Request Proof' : modal.charAt(0).toUpperCase() + modal.slice(1)} Listing
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {modal === 'approve' && 'The listing will be published immediately. The seller will be notified.'}
              {modal === 'reject'  && 'Provide a reason. The seller will be notified and can resubmit if attempts remain.'}
              {modal === 'proof'   && 'Describe exactly what proof you need. Seller has 3 days to respond.'}
              {modal === 'remove'  && 'Provide a reason for removing this published listing.'}
            </p>
            {modal !== 'approve' && (
              <textarea
                rows={4}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={
                  modal === 'reject' ? 'Rejection reason...' :
                  modal === 'proof'  ? 'What proof is needed...' :
                  'Removal reason...'
                }
                className={`w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputError ? 'border-red-400' : 'border-gray-300'}`}
              />
            )}
            {inputError && <p className="text-xs text-red-600 mt-1">{inputError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={closeModal} className="flex-1 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={doAction}
                disabled={actionLoading}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
                  modal === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  modal === 'proof'   ? 'bg-orange-500 hover:bg-orange-600' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading ? '...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-700 mt-0.5">{value || '—'}</p>
    </div>
  )
}

function ActionBtn({ colour, onClick, children }) {
  const colours = {
    green:  'bg-green-600 hover:bg-green-700 text-white',
    orange: 'bg-orange-500 hover:bg-orange-600 text-white',
    red:    'bg-red-600 hover:bg-red-700 text-white',
    gray:   'bg-gray-100 hover:bg-gray-200 text-gray-700',
  }
  return (
    <button onClick={onClick} className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${colours[colour]}`}>
      {children}
    </button>
  )
}
