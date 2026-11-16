import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'

export default function CreateListingPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    title: '', category: '', listing_type: 'sale',
    description: '', price: '', location: '',
    availability: '', features: '',
  })
  const [images, setImages]         = useState([])        // File[]
  const [previews, setPreviews]     = useState([])        // object URL[]
  const [errors, setErrors]         = useState({})
  const [globalError, setGlobalError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get('/listings/categories/').then(({ data }) => setCategories(data)).catch(() => {})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleImages = (e) => {
    const files = Array.from(e.target.files)
    setImages(prev => [...prev, ...files])
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removeImage = (i) => {
    URL.revokeObjectURL(previews[i])
    setImages(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const parseFeatures = (raw) => {
    if (!raw.trim()) return {}
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    } catch {}
    // Try key:value line format
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setGlobalError('')

    if (images.length === 0) {
      setErrors({ images: 'At least one image is required.' })
      return
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title',        form.title)
      fd.append('category',     form.category)
      fd.append('listing_type', form.listing_type)
      fd.append('description',  form.description)
      fd.append('price',        form.price)
      fd.append('location',     form.location)
      if (form.availability) fd.append('availability', form.availability)
      fd.append('features', JSON.stringify(parseFeatures(form.features)))
      images.forEach(img => fd.append('images', img))

      const { data } = await api.post('/listings/my/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate(`/seller/listings/${data.id}`)
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
      } else {
        setGlobalError('Failed to create listing. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const Field = ({ label, name, required, children }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {errors[name] && <p className="text-xs text-red-600 mt-1">{errors[name]}</p>}
    </div>
  )

  const inputCls = (name) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[name] ? 'border-red-400' : 'border-gray-300'}`

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/seller/listings" className="text-sm text-blue-600 hover:underline">← My Listings</Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Create New Listing</h1>
      <p className="text-sm text-gray-500 mb-7">Your listing will be reviewed by our team before going live.</p>

      <Alert type="error" message={globalError} />

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <p className="font-semibold text-gray-800 text-sm">Basic Information</p>

          <Field label="Title" name="title" required>
            <input
              type="text" required value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Modern 3-bedroom apartment in central Nairobi"
              className={inputCls('title')}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Category" name="category" required>
              <select
                required value={form.category}
                onChange={e => set('category', e.target.value)}
                className={inputCls('category')}
              >
                <option value="">Select category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Listing Type" name="listing_type" required>
              <select
                value={form.listing_type}
                onChange={e => set('listing_type', e.target.value)}
                className={inputCls('listing_type')}
              >
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </Field>
          </div>

          <Field label="Description" name="description" required>
            <textarea
              required rows={5} value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe your listing in detail..."
              className={`${inputCls('description')} resize-none`}
            />
          </Field>
        </div>

        {/* Price & Location */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <p className="font-semibold text-gray-800 text-sm">Price & Location</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Price ($)" name="price" required>
              <input
                type="number" required min="0" step="0.01"
                value={form.price}
                onChange={e => set('price', e.target.value)}
                placeholder="0.00"
                className={inputCls('price')}
              />
            </Field>

            <Field label="Location" name="location" required>
              <input
                type="text" required value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="e.g. Westlands, Nairobi"
                className={inputCls('location')}
              />
            </Field>
          </div>

          <Field label="Availability" name="availability">
            <input
              type="text" value={form.availability}
              onChange={e => set('availability', e.target.value)}
              placeholder="e.g. Available from January 2026, Immediate"
              className={inputCls('availability')}
            />
          </Field>
        </div>

        {/* Features */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
          <p className="font-semibold text-gray-800 text-sm">Features <span className="text-gray-400 font-normal">(optional)</span></p>
          <p className="text-xs text-gray-400">
            Enter one feature per line as <code className="bg-gray-100 px-1 rounded">key: value</code> — e.g. <code className="bg-gray-100 px-1 rounded">Bedrooms: 3</code>
          </p>
          <Field label="" name="features">
            <textarea
              rows={5} value={form.features}
              onChange={e => set('features', e.target.value)}
              placeholder={'Bedrooms: 3\nBathrooms: 2\nParking: Yes\nFurnished: No'}
              className={`${inputCls('features')} resize-none font-mono text-xs`}
            />
          </Field>
        </div>

        {/* Images */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <p className="font-semibold text-gray-800 text-sm">
            Photos <span className="text-red-500">*</span>
          </p>
          <p className="text-xs text-gray-400">At least one photo is required. The first photo will be the primary image.</p>

          {errors.images && <p className="text-xs text-red-600">{errors.images}</p>}

          {/* Previews */}
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-xs text-center py-0.5">
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <p className="text-sm text-gray-500">Click to add photos</p>
              <p className="text-xs text-gray-400">JPG, PNG, WEBP</p>
            </div>
            <input
              type="file" multiple accept="image/*"
              onChange={handleImages} className="hidden"
            />
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting && <Spinner size="sm" />}
          {submitting ? 'Submitting...' : 'Submit Listing for Review'}
        </button>
      </form>
    </div>
  )
}
