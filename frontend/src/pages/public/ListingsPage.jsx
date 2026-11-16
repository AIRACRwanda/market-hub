import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'

// ─── debounce hook ───────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [d, setD] = useState(value)
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t) }, [value, delay])
  return d
}

// ─── PRICE RANGE PRESETS ─────────────────────────────────────────────────────
const PRICE_PRESETS = [
  { label: 'Under $1,000',      min: '',     max: '1000'  },
  { label: '$1,000 – $15,000',  min: '1000', max: '15000' },
  { label: 'More than $15,000', min: '15000',max: ''      },
  { label: 'Custom',            min: null,   max: null    },
]

const TYPE_OPTIONS = [
  { label: 'For Sale', value: 'sale' },
  { label: 'For Rent', value: 'rent' },
]

// ─────────────────────────────────────────────────────────────────────────────
// PAGE ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // URL state
  const q            = searchParams.get('q')            || ''
  const category     = searchParams.get('category')     || ''
  const listing_type = searchParams.get('listing_type') || ''
  const location     = searchParams.get('location')     || ''
  const price_min    = searchParams.get('price_min')    || ''
  const price_max    = searchParams.get('price_max')    || ''
  const ordering     = searchParams.get('ordering')     || '-created_at'
  const page         = parseInt(searchParams.get('page') || '1', 10)

  // Local search input (debounced)
  const [qInput, setQInput] = useState(q)
  const debouncedQ = useDebounce(qInput, 400)
  useEffect(() => { setParam('q', debouncedQ) }, [debouncedQ])

  // Data
  const [data, setData]       = useState({ results: [], count: 0, total_pages: 1, page: 1 })
  const [categories, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // Right panel — selected listing
  const [selected, setSelected] = useState(null)
  const [selLoading, setSelLoading] = useState(false)
  const [activeTab, setActiveTab]   = useState('overview')
  const [activeImg, setActiveImg]   = useState(0)

  // Mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Price preset
  const [pricePreset, setPricePreset] = useState('custom')

  // ── helpers ──────────────────────────────────────────────────────────────
  const setParam = useCallback((key, value, resetPage = false) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value); else next.delete(key)
      if (resetPage) next.delete('page')
      return next
    })
  }, [setSearchParams])

  const setFilter = (key, value) => setParam(key, value, true)
  const clearAll  = () => { setQInput(''); setSearchParams({}) }
  const activeFilters = [q, category, listing_type, location, price_min, price_max].filter(Boolean).length

  // ── fetch categories ──────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/listings/categories/').then(({ data }) => setCats(data)).catch(() => {})
  }, [])

  // ── fetch listings ────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true); setError('')
    const params = { page, ordering }
    if (q)            params.q            = q
    if (category)     params.category     = category
    if (listing_type) params.listing_type = listing_type
    if (location)     params.location     = location
    if (price_min)    params.price_min    = price_min
    if (price_max)    params.price_max    = price_max
    api.get('/listings/', { params })
      .then(({ data }) => { setData(data); if (!selected && data.results.length) loadDetail(data.results[0].id) })
      .catch(() => setError('Failed to load listings.'))
      .finally(() => setLoading(false))
  }, [q, category, listing_type, location, price_min, price_max, ordering, page])

  // ── load right-panel detail ───────────────────────────────────────────────
  const loadDetail = (id) => {
    setSelLoading(true); setActiveImg(0); setActiveTab('overview')
    api.get(`/listings/${id}/`)
      .then(({ data }) => setSelected(data))
      .catch(() => setSelected(null))
      .finally(() => setSelLoading(false))
  }

  // ── price preset apply ────────────────────────────────────────────────────
  const applyPreset = (preset) => {
    setPricePreset(preset.label)
    if (preset.min !== null) {
      setFilter('price_min', preset.min)
      setFilter('price_max', preset.max)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── TOP PILL TABS (Buy / Rent / Favorite / Help) ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            {[
              { label: 'Buy',  val: 'sale' },
              { label: 'Rent', val: 'rent' },
              { label: 'All',  val: ''     },
            ].map(tab => (
              <button
                key={tab.label}
                onClick={() => setFilter('listing_type', tab.val)}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  listing_type === tab.val || (!listing_type && tab.val === '')
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <span className="text-gray-300 mx-1">|</span>
            {['Favorite', 'Help', 'Services'].map(l => (
              <button key={l} className="px-3 py-1.5 text-sm text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors">{l}</button>
            ))}
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-sm relative">
            <input
              type="text"
              value={qInput}
              onChange={e => setQInput(e.target.value)}
              placeholder="Search anything..."
              className="w-full border border-gray-200 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 pr-8"
            />
            {qInput && (
              <button onClick={() => setQInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>

          {/* Sort */}
          <select
            value={ordering}
            onChange={e => setParam('ordering', e.target.value, true)}
            className="border border-gray-200 rounded-full px-3 py-1.5 text-xs text-gray-600 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="-created_at">Newest First</option>
            <option value="created_at">Oldest First</option>
            <option value="price">Price ↑</option>
            <option value="-price">Price ↓</option>
          </select>
        </div>
      </div>

      {/* ── 3-COLUMN LAYOUT ── */}
      <div className="max-w-[1400px] mx-auto px-4 py-5 flex gap-4">

        {/* ══════════════════════════════════════════
            LEFT — Custom Filter sidebar
        ══════════════════════════════════════════ */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 flex-shrink-0
          bg-white rounded-2xl shadow-sm border border-gray-100
          overflow-y-auto
          transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          self-start
        `} style={{ maxHeight: 'calc(100vh - 7rem)' }}>

          <div className="p-4 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-800 text-sm">Custom Filter</span>
              {activeFilters > 0 && (
                <button onClick={clearAll} className="text-xs text-blue-600 hover:underline font-medium">Clear all</button>
              )}
            </div>

            {/* ── Location ── */}
            <FilterGroup icon={LocationIcon} label="Location">
              <LocationInput value={location} onChange={val => setFilter('location', val)} />
            </FilterGroup>

            {/* ── Category ── */}
            <FilterGroup icon={GridIcon} label="Category">
              <div className="space-y-1.5 mt-1">
                <CheckRow label="All Categories" checked={!category} onChange={() => setFilter('category', '')} />
                {categories.map(c => (
                  <CheckRow key={c.id} label={c.name} checked={category === c.slug} onChange={() => setFilter('category', category === c.slug ? '' : c.slug)} />
                ))}
              </div>
            </FilterGroup>

            {/* ── Price Range ── */}
            <FilterGroup icon={PriceIcon} label="Price Range">
              <div className="space-y-1.5 mt-1">
                {PRICE_PRESETS.map(p => (
                  <RadioRow
                    key={p.label}
                    label={p.label}
                    checked={pricePreset === p.label}
                    onChange={() => applyPreset(p)}
                  />
                ))}
              </div>
              {/* Custom price inputs */}
              <div className="flex items-center gap-2 mt-3">
                <input type="number" min="0" value={price_min} onChange={e => { setPricePreset('Custom'); setFilter('price_min', e.target.value) }}
                  placeholder="Min" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <span className="text-gray-300 text-xs">–</span>
                <input type="number" min="0" value={price_max} onChange={e => { setPricePreset('Custom'); setFilter('price_max', e.target.value) }}
                  placeholder="Max" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </FilterGroup>

            {/* ── Listing Type ── */}
            <FilterGroup icon={TypeIcon} label="Type of Listing">
              <div className="space-y-1.5 mt-1">
                <CheckRow label="All" checked={!listing_type} onChange={() => setFilter('listing_type', '')} />
                {TYPE_OPTIONS.map(t => (
                  <CheckRow key={t.value} label={t.label} checked={listing_type === t.value} onChange={() => setFilter('listing_type', listing_type === t.value ? '' : t.value)} />
                ))}
              </div>
            </FilterGroup>

            {/* ── Amenities / quick tags ── */}
            <FilterGroup icon={AmenityIcon} label="Amenities">
              <div className="flex flex-wrap gap-1.5 mt-1">
                {['Garden', 'Gym', 'Swimming Pool', 'Parking', 'WiFi'].map(a => (
                  <button key={a}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors border border-blue-100">
                    {a}
                  </button>
                ))}
              </div>
            </FilterGroup>
          </div>
        </aside>

        {/* ══════════════════════════════════════════
            CENTER — Listing grid
        ══════════════════════════════════════════ */}
        <div className="flex-1 min-w-0">

          {/* Result count + mobile filter btn */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:border-blue-400">
                <FilterIcon />
              </button>
              <p className="text-sm text-gray-500">
                {loading ? '...' : <><span className="font-bold text-gray-900">{data.count.toLocaleString()}</span> results found</>}
              </p>
            </div>
            {/* Active chips */}
            <div className="flex flex-wrap gap-1.5">
              {q            && <Chip label={`"${q}"`}                                        onRemove={() => { setQInput(''); setFilter('q', '') }} />}
              {category     && <Chip label={categories.find(c => c.slug === category)?.name || category} onRemove={() => setFilter('category', '')} />}
              {listing_type && <Chip label={listing_type === 'sale' ? 'For Sale' : 'For Rent'} onRemove={() => setFilter('listing_type', '')} />}
              {location     && <Chip label={`📍 ${location}`}                                onRemove={() => setFilter('location', '')} />}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 mb-4">{error}</div>
          )}

          {loading ? (
            <div className="flex justify-center py-24"><Spinner size="lg" /></div>
          ) : data.results.length === 0 ? (
            <EmptyState onClear={clearAll} hasFilters={activeFilters > 0} />
          ) : (
            <>
              {/* 2-column grid — matches DailyFarm reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.results.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    selected={selected?.id === listing.id}
                    onClick={() => loadDetail(listing.id)}
                  />
                ))}
              </div>

              {data.total_pages > 1 && (
                <Pagination page={data.page} totalPages={data.total_pages}
                  onPage={p => setParam('page', p > 1 ? String(p) : '')} />
              )}
            </>
          )}
        </div>

        {/* ══════════════════════════════════════════
            RIGHT — Detail panel (DailyFarm style)
        ══════════════════════════════════════════ */}
        <aside className="hidden xl:flex flex-col w-80 2xl:w-96 flex-shrink-0 gap-4 self-start sticky top-20">
          {selLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex justify-center"><Spinner size="md" /></div>
          ) : selected ? (
            <DetailPanel listing={selected} activeTab={activeTab} setActiveTab={setActiveTab} activeImg={activeImg} setActiveImg={setActiveImg} user={user} />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
              <p className="text-sm">Select a listing to see details</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTING CARD  (DailyFarm style — photo, badge, bookmark, title, location, price, rating)
// ─────────────────────────────────────────────────────────────────────────────
function ListingCard({ listing, selected, onClick }) {
  const [bookmarked, setBookmarked] = useState(false)

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl overflow-hidden shadow-sm border-2 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
        selected ? 'border-blue-500 shadow-blue-100' : 'border-transparent hover:border-blue-200'
      }`}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        {listing.primary_image ? (
          <img src={listing.primary_image} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}
        {/* Category badge top-left */}
        <span className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
          {listing.category_name || (listing.listing_type === 'sale' ? 'For Sale' : 'For Rent')}
        </span>
        {/* Bookmark top-right */}
        <button
          onClick={e => { e.stopPropagation(); setBookmarked(!bookmarked) }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors ${bookmarked ? 'bg-blue-600 text-white' : 'bg-white/95 text-gray-400 hover:text-blue-600'}`}
        >
          <svg className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-1">{listing.title}</h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{listing.location}</span>
        </div>

        {/* Price + Rating */}
        <div className="flex items-center justify-between mt-1">
          <div>
            <span className="text-blue-600 font-extrabold text-base">${Number(listing.price).toLocaleString()}</span>
            {listing.listing_type === 'rent' && <span className="text-gray-400 text-xs ml-1">/month</span>}
          </div>
          {/* Star rating placeholder */}
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(s => (
              <svg key={s} className={`w-3 h-3 ${s <= 4 ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-xs text-gray-400 ml-1">4/5</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RIGHT DETAIL PANEL
// ─────────────────────────────────────────────────────────────────────────────
function DetailPanel({ listing, activeTab, setActiveTab, activeImg, setActiveImg, user }) {
  const images = listing.images || []

  return (
    <>
      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Image gallery */}
        <div className="relative">
          {/* Main image */}
          <div className="h-44 bg-gray-100 overflow-hidden">
            {images[activeImg]
              ? <img src={images[activeImg].image} alt={listing.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-gray-200">
                  <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
            }
          </div>
          {/* Thumbnail strip — right side like DailyFarm */}
          {images.length > 1 && (
            <div className="absolute right-2 top-2 flex flex-col gap-1.5">
              {images.slice(0, 3).map((img, i) => (
                <button key={img.id} onClick={() => setActiveImg(i)}
                  className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? 'border-blue-500' : 'border-white/80 opacity-80 hover:opacity-100'}`}>
                  <img src={img.image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title + price */}
        <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
          <div>
            <h2 className="font-extrabold text-gray-900 text-sm leading-snug line-clamp-1">{listing.title}</h2>
            <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{listing.location}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-blue-600 font-extrabold text-base">${Number(listing.price).toLocaleString()}</p>
            {listing.listing_type === 'rent' && <p className="text-gray-400 text-[10px]">/month</p>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4">
          {['overview', 'features', 'about'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-2 mr-5 text-xs font-semibold capitalize border-b-2 transition-colors ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              {tab === 'overview' ? 'Overview' : tab === 'features' ? 'Features' : 'About'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-4 py-3">
          {activeTab === 'overview' && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Description:</p>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-4">{listing.description}</p>
              <button className="text-xs text-blue-600 hover:underline mt-1 font-medium">Read More...</button>
            </div>
          )}

          {activeTab === 'features' && (
            <div>
              {listing.features && Object.keys(listing.features).length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(listing.features).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5">
                      <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 leading-none">{k}</p>
                        <p className="text-xs font-semibold text-gray-700">{String(v)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No features listed.</p>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between"><span className="text-gray-400">Seller</span><span className="font-semibold">{listing.seller_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Category</span><span className="font-semibold">{listing.category_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Type</span><span className="font-semibold capitalize">{listing.listing_type}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Availability</span><span className="font-semibold">{listing.availability || 'Available'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Listed</span><span className="font-semibold">{new Date(listing.created_at).toLocaleDateString()}</span></div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-4 flex gap-2 mt-1">
          <Link
            to={`/listings/${listing.id}`}
            className="flex-1 text-center py-2 border-2 border-blue-600 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-50 transition-colors"
          >
            View Full
          </Link>
          {user?.role === 'buyer' ? (
            <Link
              to={`/buyer/enquiries/new?listing=${listing.id}`}
              className="flex-1 text-center py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              Enquire Now
            </Link>
          ) : !user ? (
            <Link
              to="/login"
              className="flex-1 text-center py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              Sign In to Enquire
            </Link>
          ) : null}
        </div>
      </div>

      {/* Map placeholder */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-36 bg-gradient-to-br from-green-100 via-blue-50 to-green-200 relative flex items-center justify-center">
          {/* Map grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 320 144">
            {[0,32,64,96,128,160,192,224,256,288,320].map(x => <line key={x} x1={x} y1="0" x2={x} y2="144" stroke="#6b7280" strokeWidth="0.5"/>)}
            {[0,24,48,72,96,120,144].map(y => <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#6b7280" strokeWidth="0.5"/>)}
          </svg>
          {/* Map pins */}
          <div className="absolute top-6 left-16">
            <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
          <div className="absolute top-12 left-28">
            <div className="w-5 h-5 bg-orange-500 rounded-full border-2 border-white shadow-md" />
          </div>
          <div className="absolute bottom-8 right-20">
            <div className="w-5 h-5 bg-green-600 rounded-full border-2 border-white shadow-md" />
          </div>
          <div className="absolute top-8 right-12">
            <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-md" />
          </div>
          {/* Current listing price bubble */}
          <div className="bg-white rounded-xl px-3 py-1.5 shadow-lg border border-gray-100 z-10">
            <p className="text-xs font-bold text-gray-900">${Number(listing.price).toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{listing.location}</p>
          </div>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER SIDEBAR HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function FilterGroup({ icon: Icon, label, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-gray-100 pb-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{label}</span>
        </div>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && children}
    </div>
  )
}

function CheckRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div onClick={onChange}
        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
        {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </div>
      <span className={`text-xs transition-colors ${checked ? 'text-blue-600 font-semibold' : 'text-gray-600 group-hover:text-gray-800'}`}>{label}</span>
    </label>
  )
}

function RadioRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div onClick={onChange}
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
        {checked && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
      </div>
      <span className={`text-xs ${checked ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>{label}</span>
    </label>
  )
}

function LocationInput({ value, onChange }) {
  const [input, setInput]       = useState(value)
  const [sugg, setSugg]         = useState([])
  const [open, setOpen]         = useState(false)
  const debounced               = useDebounce(input, 300)
  const ref                     = useRef(null)

  useEffect(() => {
    if (debounced.length < 2) { setSugg([]); return }
    api.get('/listings/locations/', { params: { q: debounced } })
      .then(({ data }) => { setSugg(data); setOpen(data.length > 0) }).catch(() => {})
  }, [debounced])

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative mt-1">
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-400">
        <svg className="w-3.5 h-3.5 text-gray-400 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <input type="text" value={input} onChange={e => { setInput(e.target.value); if (!e.target.value) onChange('') }}
          onKeyDown={e => { if (e.key === 'Enter') { onChange(input); setOpen(false) } }}
          placeholder="Enter location..." className="flex-1 py-2 px-2 text-xs focus:outline-none bg-transparent" />
        {input && <button onClick={() => { setInput(''); onChange('') }} className="pr-2 text-gray-400 hover:text-gray-600 text-xs">×</button>}
      </div>
      {open && sugg.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {sugg.map(s => (
            <li key={s}>
              <button onMouseDown={() => { setInput(s); onChange(s); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                📍 {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPage }) {
  const pages = []
  const left  = Math.max(1, page - 2)
  const right = Math.min(totalPages, page + 2)
  if (left > 1) pages.push(1)
  if (left > 2) pages.push('...')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < totalPages - 1) pages.push('...')
  if (right < totalPages) pages.push(totalPages)

  return (
    <div className="flex items-center justify-center gap-1 mt-8 flex-wrap">
      <PageBtn onClick={() => onPage(page - 1)} disabled={page === 1} label="‹" />
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`e-${i}`} className="px-1 text-gray-400 text-sm">…</span>
          : <PageBtn key={p} onClick={() => onPage(p)} active={p === page} label={String(p)} />
      )}
      <PageBtn onClick={() => onPage(page + 1)} disabled={page === totalPages} label="›" />
    </div>
  )
}

function PageBtn({ onClick, disabled, active, label }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
      }`}>
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE + CHIP
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ onClear, hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-2xl">🔍</div>
      <p className="text-base font-bold text-gray-700 mb-1">No listings found</p>
      <p className="text-sm text-gray-400 mb-5">{hasFilters ? 'Try adjusting your filters.' : 'No published listings yet.'}</p>
      {hasFilters && (
        <button onClick={onClear} className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
          Clear Filters
        </button>
      )}
    </div>
  )
}

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900 font-bold leading-none ml-0.5">×</button>
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TINY ICON COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const LocationIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const PriceIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const GridIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)
const TypeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
  </svg>
)
const AmenityIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)
const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)
