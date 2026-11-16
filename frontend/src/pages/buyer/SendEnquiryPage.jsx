import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'

export default function SendEnquiryPage() {
  const [searchParams] = useSearchParams()
  const listingId      = searchParams.get('listing')
  const navigate       = useNavigate()

  const [listing, setListing]     = useState(null)
  const [loadingListing, setLoadingListing] = useState(true)
  const [listingError, setListingError]     = useState('')

  const [form, setForm] = useState({
    subject: '',
    initial_message: '',
    viewing_requested: false,
    viewing_date: '',
  })
  const [errors, setErrors]       = useState({})
  const [globalError, setGlobalError] = useState('')
  const [submitting, setSubmitting]   = useState(false)

  useEffect(() => {
    if (!listingId) { setListingError('No listing specified.'); setLoadingListing(false); return }
    api.get(`/listings/${listingId}/`)
      .then(({ data }) => setListing(data))
      .catch(() => setListingError('Listing not found or no longer available.'))
      .finally(() => setLoadingListing(false))
  }, [listingId])

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setGlobalError('')
    setSubmitting(true)

    const payload = {
      listing: parseInt(listingId, 10),
      subject: form.subject || undefined,
      initial_message: form.initial_message,
      viewing_requested: form.viewing_requested,
    }
    if (form.viewing_requested && form.viewing_date) {
      payload.viewing_date = form.viewing_date
    }

    try {
      const { data } = await api.post('/enquiries/buyer/', payload)
      navigate(`/buyer/enquiries/${data.id}`)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const field = {}
        let global = ''
        for (const [k, v] of Object.entries(data)) {
          const msg = Array.isArray(v) ? v.join(' ') : String(v)
          if (k === 'detail' || k === 'non_field_errors') global = msg
          else field[k] = msg
        }
        setErrors(field)
        if (global) setGlobalError(global)
        else if (!Object.keys(field).length) setGlobalError('Failed to send enquiry.')
      } else {
        setGlobalError('Failed to send enquiry.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingListing) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>

  if (listingError) return (
    <div className="max-w-2xl mx-auto px-4 py-20">
      <Alert type="error" message={listingError} />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link to={`/listings/${listingId}`} className="text-sm text-blue-600 hover:underline mb-6 inline-block">
        ← Back to listing
      </Link>

      {/* Listing summary card */}
      {listing && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 flex gap-4">
          {listing.images?.[0] && (
            <img src={listing.images[0].image} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{listing.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">📍 {listing.location}</p>
            <p className="text-blue-700 font-bold mt-1">${Number(listing.price).toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Send Enquiry</h1>
        <p className="text-sm text-gray-500 mb-5">Your message will go directly to the seller.</p>

        <Alert type="error" message={globalError} />

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject <span className="text-gray-400">(optional)</span></label>
            <input
              type="text"
              value={form.subject}
              onChange={e => set('subject', e.target.value)}
              placeholder="e.g. Interested in viewing"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
            <textarea
              rows={5}
              required
              value={form.initial_message}
              onChange={e => set('initial_message', e.target.value)}
              placeholder="Introduce yourself and ask your questions..."
              className={`w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.initial_message ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.initial_message && <p className="text-xs text-red-600 mt-1">{errors.initial_message}</p>}
          </div>

          {/* Viewing option */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.viewing_requested}
              onChange={e => set('viewing_requested', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Also request a viewing appointment</span>
          </label>

          {form.viewing_requested && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred viewing date & time</label>
              <input
                type="datetime-local"
                value={form.viewing_date}
                onChange={e => set('viewing_date', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {errors.non_field_errors && <Alert type="error" message={errors.non_field_errors} />}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? <Spinner size="sm" /> : null}
            {submitting ? 'Sending...' : 'Send Enquiry'}
          </button>
        </form>
      </div>
    </div>
  )
}
