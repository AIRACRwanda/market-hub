import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import StatusBadge from '../../components/ui/StatusBadge'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EDITABLE_STATUSES   = ['pending_review', 'rejected', 'expired', 'hidden']
const LOCKED_MSG = {
  published:            'This listing is live. Pause it first to make changes.',
  under_review:         'Under review by admin — edits not allowed until a decision is made.',
  permanently_rejected: 'Permanently rejected — this listing cannot be resubmitted.',
}

export default function ManageListingPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()

  const [listing, setListing]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [successMsg, setSuccess]  = useState('')
  const [activeTab, setTab]       = useState('details')   // details | images | proof

  const load = () => {
    setLoading(true)
    api.get(`/listings/my/${id}/`)
      .then(({ data }) => setListing(data))
      .catch(() => setError('Listing not found.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>
  if (error && !listing) return <div className="max-w-2xl mx-auto px-4 py-20"><Alert type="error" message={error} /></div>
  if (!listing) return null

  const canEdit  = EDITABLE_STATUSES.includes(listing.status)
  const lockMsg  = LOCKED_MSG[listing.status]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/seller/listings" className="text-sm text-blue-600 hover:underline">← My Listings</Link>
        <StatusBadge status={listing.status} />
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-1 truncate">{listing.title}</h1>
      <p className="text-sm text-gray-400 mb-6">📍 {listing.location}</p>

      {successMsg && <div className="mb-4"><Alert type="success" message={successMsg} /></div>}
      {error      && <div className="mb-4"><Alert type="error"   message={error} /></div>}

      {/* Admin notes */}
      {listing.admin_note && (
        <div className="mb-5 bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-orange-700 mb-1">Proof Request from Admin</p>
          <p className="text-sm text-orange-800">{listing.admin_note}</p>
          {listing.proof_deadline && (
            <p className="text-xs text-orange-600 mt-2 font-medium">
              Deadline: {new Date(listing.proof_deadline).toLocaleString()}
            </p>
          )}
        </div>
      )}
      {listing.rejection_reason && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason</p>
          <p className="text-sm text-red-800">{listing.rejection_reason}</p>
        </div>
      )}

      {/* Status actions */}
      <StatusActions
        listing={listing}
        onDone={(msg) => { setSuccess(msg); load() }}
        onError={setError}
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 mt-6">
        {[
          { key: 'details', label: 'Details' },
          { key: 'images',  label: `Images (${listing.images?.length ?? 0})` },
          ...(listing.status === 'proof_requested' ? [{ key: 'proof', label: 'Submit Proof' }] : []),
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === tab.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'details' && (
        <DetailsTab
          listing={listing}
          canEdit={canEdit}
          lockMsg={lockMsg}
          onSaved={(msg) => { setSuccess(msg); load() }}
          onError={setError}
        />
      )}

      {activeTab === 'images' && (
        <ImagesTab
          listing={listing}
          onDone={(msg) => { setSuccess(msg); load() }}
          onError={setError}
        />
      )}

      {activeTab === 'proof' && listing.status === 'proof_requested' && (
        <ProofTab
          listing={listing}
          onDone={(msg) => { setSuccess(msg); load(); setTab('details') }}
          onError={setError}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status actions bar
// ---------------------------------------------------------------------------

function StatusActions({ listing, onDone, onError }) {
  const [busy, setBusy] = useState('')

  const doAction = async (action) => {
    setBusy(action)
    try {
      const { data } = await api.post(`/listings/my/${listing.id}/status/`, { action })
      onDone(data.message)
    } catch (err) {
      onError(err.response?.data?.detail || `Action "${action}" failed.`)
    } finally {
      setBusy('')
    }
  }

  const doRemove = async () => {
    if (!window.confirm('Remove this listing? This cannot be undone.')) return
    setBusy('remove')
    try {
      await api.delete(`/listings/my/${listing.id}/`)
      onDone('Listing removed.')
    } catch (err) {
      onError(err.response?.data?.detail || 'Failed to remove listing.')
    } finally {
      setBusy('')
    }
  }

  const s = listing.status
  const actions = []

  if (s === 'published')   actions.push({ key: 'pause',     label: 'Pause Listing',      cls: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' })
  if (s === 'published')   actions.push({ key: 'sold',      label: 'Mark as Sold',        cls: 'bg-purple-100 text-purple-800 hover:bg-purple-200' })
  if (s === 'published' && listing.listing_type === 'rent')
                           actions.push({ key: 'rented',    label: 'Mark as Rented',      cls: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' })
  if (s === 'rejected')    actions.push({ key: 'resubmit',  label: 'Resubmit for Review', cls: 'bg-blue-100 text-blue-800 hover:bg-blue-200' })

  if (actions.length === 0 && !['permanently_rejected','removed'].includes(s)) {
    actions.push({ key: '__remove__', label: 'Remove Listing', cls: 'bg-red-100 text-red-700 hover:bg-red-200' })
  }

  if (actions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {actions.map(a => a.key === '__remove__' ? (
        <button key="remove" onClick={doRemove} disabled={busy === 'remove'}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${a.cls}`}>
          {busy === 'remove' ? '...' : a.label}
        </button>
      ) : (
        <button key={a.key} onClick={() => doAction(a.key)} disabled={!!busy}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${a.cls}`}>
          {busy === a.key ? '...' : a.label}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Details tab — view + edit
// ---------------------------------------------------------------------------

function DetailsTab({ listing, canEdit, lockMsg, onSaved, onError }) {
  const [editing, setEditing] = useState(false)
  const [categories, setCats] = useState([])
  const [form, setForm]       = useState({
    title:        listing.title,
    category:     listing.category,
    listing_type: listing.listing_type,
    description:  listing.description,
    price:        listing.price,
    location:     listing.location,
    availability: listing.availability || '',
    features:     Object.entries(listing.features || {}).map(([k, v]) => `${k}: ${v}`).join('\n'),
  })
  const [errors, setErrors]   = useState({})
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (editing) api.get('/listings/categories/').then(({ data }) => setCats(data)).catch(() => {})
  }, [editing])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const parseFeatures = (raw) => {
    if (!raw.trim()) return {}
    const obj = {}
    for (const line of raw.split('\n')) {
      const idx = line.indexOf(':')
      if (idx > 0) {
        const k = line.slice(0, idx).trim()
        const v = line.slice(idx + 1).trim()
        if (k) obj[k] = v
      }
    }
    return obj
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      await api.patch(`/listings/my/${listing.id}/`, {
        title:        form.title,
        category:     form.category,
        listing_type: form.listing_type,
        description:  form.description,
        price:        parseFloat(form.price),
        location:     form.location,
        availability: form.availability || null,
        features:     parseFeatures(form.features),
      })
      setEditing(false)
      onSaved('Listing updated.')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') setErrors(data)
      else onError('Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = (name) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[name] ? 'border-red-400' : 'border-gray-300'}`

  if (!editing) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-800">Listing Details</p>
          {canEdit ? (
            <button onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:underline font-medium">Edit</button>
          ) : lockMsg ? (
            <span className="text-xs text-gray-400">{lockMsg}</span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Detail label="Category"    value={listing.category_name} />
          <Detail label="Type"        value={listing.listing_type === 'sale' ? 'For Sale' : 'For Rent'} />
          <Detail label="Price"       value={`$${Number(listing.price).toLocaleString()}`} />
          <Detail label="Location"    value={listing.location} />
          <Detail label="Availability" value={listing.availability || '—'} />
          <Detail label="Attempts"    value={`${listing.proof_attempts} / 3`} />
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
        </div>

        {listing.features && Object.keys(listing.features).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Features</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(listing.features).map(([k, v]) => (
                <span key={k} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">{k}: {String(v)}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={save} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
      <p className="font-semibold text-gray-800">Edit Details</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input type="text" value={form.title} onChange={e => set('title', e.target.value)} className={inputCls('title')} required />
        {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls('category')} required>
            <option value="">Select...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={form.listing_type} onChange={e => set('listing_type', e.target.value)} className={inputCls('listing_type')}>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea rows={5} value={form.description} onChange={e => set('description', e.target.value)}
          className={`${inputCls('description')} resize-none`} required />
        {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
          <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)}
            className={inputCls('price')} required />
          {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
            className={inputCls('location')} required />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
        <input type="text" value={form.availability} onChange={e => set('availability', e.target.value)}
          placeholder="e.g. Available from January 2026" className={inputCls('availability')} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Features <span className="text-gray-400">(key: value, one per line)</span></label>
        <textarea rows={4} value={form.features} onChange={e => set('features', e.target.value)}
          className={`${inputCls('features')} resize-none font-mono text-xs`}
          placeholder={'Bedrooms: 3\nBathrooms: 2'} />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => setEditing(false)}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Images tab
// ---------------------------------------------------------------------------

function ImagesTab({ listing, onDone, onError }) {
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy]           = useState(null)   // image id being acted on

  const upload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    e.target.value = ''
    setUploading(true)
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('images', f))
      await api.post(`/listings/my/${listing.id}/images/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onDone('Images uploaded.')
    } catch (err) {
      onError(err.response?.data?.detail || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const setPrimary = async (imgId) => {
    setBusy(imgId)
    try {
      await api.patch(`/listings/my/${listing.id}/images/${imgId}/primary/`)
      onDone('Primary image updated.')
    } catch (err) {
      onError('Failed to update primary image.')
    } finally {
      setBusy(null)
    }
  }

  const removeImage = async (imgId) => {
    if (!window.confirm('Remove this image?')) return
    setBusy(imgId)
    try {
      await api.delete(`/listings/my/${listing.id}/images/${imgId}/`)
      onDone('Image removed.')
    } catch (err) {
      onError(err.response?.data?.detail || 'Failed to remove image.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
      <p className="font-semibold text-gray-800">Listing Images</p>

      {listing.images?.length === 0 ? (
        <p className="text-sm text-gray-400">No images yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {listing.images.map(img => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square">
              <img src={img.image} alt="" className="w-full h-full object-cover" />
              {img.is_primary && (
                <span className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-xs text-center py-0.5">
                  Primary
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.is_primary && (
                  <button
                    onClick={() => setPrimary(img.id)}
                    disabled={busy === img.id}
                    className="bg-white text-blue-700 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-blue-50"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  onClick={() => removeImage(img.id)}
                  disabled={busy === img.id}
                  className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-lg hover:bg-red-600"
                >
                  {busy === img.id ? '...' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className={`flex items-center justify-center w-full h-20 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
        uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
      }`}>
        <div className="text-center">
          {uploading
            ? <p className="text-sm text-blue-600">Uploading...</p>
            : <>
                <p className="text-sm text-gray-500">Click to add more photos</p>
                <p className="text-xs text-gray-400">JPG, PNG, WEBP</p>
              </>
          }
        </div>
        <input type="file" multiple accept="image/*" onChange={upload} disabled={uploading} className="hidden" />
      </label>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Proof submission tab
// ---------------------------------------------------------------------------

function ProofTab({ listing, onDone, onError }) {
  const [image, setImage]       = useState(null)
  const [preview, setPreview]   = useState('')
  const [document, setDocument] = useState(null)
  const [sellerNote, setNote]   = useState('')
  const [submitting, setSub]    = useState(false)
  const [fieldErrors, setFE]    = useState({})

  const attemptsLeft = 3 - listing.proof_attempts

  const handleImage = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setImage(f)
    setPreview(URL.createObjectURL(f))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!image) { setFE({ image: 'At least one proof image is required.' }); return }
    setSub(true)
    setFE({})
    try {
      const fd = new FormData()
      fd.append('image', image)
      if (document) fd.append('document', document)
      if (sellerNote) fd.append('seller_note', sellerNote)
      const { data } = await api.post(`/listings/my/${listing.id}/proof/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onDone(`Proof submitted (attempt ${data.attempt_number}/3). Admin will review it.`)
    } catch (err) {
      const d = err.response?.data
      if (d?.detail) onError(d.detail)
      else if (d) setFE(d)
      else onError('Proof submission failed.')
    } finally {
      setSub(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
      <div>
        <p className="font-semibold text-gray-800">Submit Proof</p>
        <p className="text-sm text-gray-500 mt-0.5">
          {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining.
          {listing.proof_deadline && (
            <span className="text-orange-600 font-medium ml-2">
              Deadline: {new Date(listing.proof_deadline).toLocaleString()}
            </span>
          )}
        </p>
      </div>

      {listing.admin_note && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
          <strong>Admin asked for:</strong> {listing.admin_note}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        {/* Proof image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proof Image <span className="text-red-500">*</span>
          </label>
          {preview && (
            <img src={preview} alt="Proof preview" className="h-40 rounded-xl object-cover border border-gray-200 mb-3" />
          )}
          <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <p className="text-sm text-gray-500">{image ? image.name : 'Click to select proof image'}</p>
              <p className="text-xs text-gray-400">JPG, PNG, WEBP</p>
            </div>
            <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </label>
          {fieldErrors.image && <p className="text-xs text-red-600 mt-1">{fieldErrors.image}</p>}
        </div>

        {/* Supporting document */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supporting Document <span className="text-gray-400">(optional)</span>
          </label>
          <label className="flex items-center justify-center w-full h-16 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <p className="text-sm text-gray-500">{document ? document.name : 'Click to attach document'}</p>
            <input
              type="file" accept=".pdf,.doc,.docx,image/*"
              onChange={e => setDocument(e.target.files[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note to Admin <span className="text-gray-400">(optional)</span></label>
          <textarea
            rows={3} value={sellerNote} onChange={e => setNote(e.target.value)}
            placeholder="Explain what this proof shows..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit" disabled={submitting}
          className="w-full py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
        >
          {submitting && <Spinner size="sm" />}
          {submitting ? 'Submitting...' : 'Submit Proof'}
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-700 mt-0.5">{value || '—'}</p>
    </div>
  )
}
