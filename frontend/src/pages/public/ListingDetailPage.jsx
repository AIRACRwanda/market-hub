import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import PaymentModal from '../../components/ui/PaymentModal'

export default function ListingDetailPage() {
  const { id }   = useParams()
  const { user } = useAuth()

  const [listing, setListing]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [activeImg, setActiveImg]     = useState(0)
  const [activeTab, setActiveTab]     = useState('overview')
  const [showPayment, setShowPayment] = useState(false)

  useEffect(() => {
    api.get(`/listings/${id}/`)
      .then(({ data }) => setListing(data))
      .catch(() => setError('Listing not found or no longer available.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  )

  if (error || !listing) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-lg font-semibold text-gray-700 mb-2">Listing not found</p>
      <p className="text-gray-400 text-sm mb-5">{error}</p>
      <Link to="/listings" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700">
        Back to Listings
      </Link>
    </div>
  )

  const images = listing.images || []

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link to="/listings" className="hover:text-blue-600">Listings</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium truncate max-w-xs">{listing.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT: Images + detail tabs ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Main image */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="relative h-72 sm:h-96 bg-gray-100">
                  {images[activeImg] ? (
                    <img
                      src={images[activeImg].image}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                      <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Type badge */}
                  <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                    listing.listing_type === 'sale' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                  }`}>
                    {listing.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                  </span>
                  {/* Price badge */}
                  <span className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-bold">
                    ${Number(listing.price).toLocaleString()}
                  </span>
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50 border-t border-gray-100">
                    {images.map((img, i) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImg(i)}
                        className={`w-16 h-12 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                          i === activeImg ? 'border-blue-500 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img.image} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Detail card with tabs */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Title row */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                        {listing.category_name}
                      </span>
                      <h1 className="text-2xl font-extrabold text-gray-900 mt-1">{listing.title}</h1>
                      <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {listing.location}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-3xl font-extrabold text-blue-600">
                        ${Number(listing.price).toLocaleString()}
                      </p>
                      {listing.listing_type === 'rent' && (
                        <p className="text-xs text-gray-400">/month</p>
                      )}
                      {/* Stars */}
                      <div className="flex items-center justify-end gap-0.5 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} className={`w-3.5 h-3.5 ${s <= 4 ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="text-xs text-gray-400 ml-1">4.0</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6">
                  {['overview', 'features', 'about'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 mr-6 text-sm font-semibold capitalize border-b-2 transition-colors ${
                        activeTab === tab
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="px-6 py-5">
                  {activeTab === 'overview' && (
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-2">Description</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{listing.description}</p>
                      {listing.availability && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-xl">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {listing.availability}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'features' && (
                    <div>
                      {listing.features && Object.keys(listing.features).length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {Object.entries(listing.features).map(([k, v]) => (
                            <div key={k} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 leading-none">{k}</p>
                                <p className="text-xs font-bold text-gray-800 mt-0.5">{String(v)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No features listed for this listing.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'about' && (
                    <div className="space-y-3">
                      {[
                        { label: 'Seller',       value: listing.seller_name },
                        { label: 'Category',     value: listing.category_name },
                        { label: 'Type',         value: listing.listing_type === 'sale' ? 'For Sale' : 'For Rent' },
                        { label: 'Availability', value: listing.availability || 'Available' },
                        { label: 'Listed',       value: new Date(listing.created_at).toLocaleDateString() },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                          <span className="text-sm text-gray-400">{row.label}</span>
                          <span className="text-sm font-semibold text-gray-800">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Seller card + CTA + map ── */}
            <div className="space-y-4">

              {/* Seller card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Listed by</p>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-bold text-lg">
                      {listing.seller_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{listing.seller_name}</p>
                    <p className="text-xs text-gray-400">{listing.seller_email}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span className="text-xs text-green-600 font-medium">Active Seller</span>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                {user?.role === 'buyer' && (
                  <div className="space-y-2">
                    <Link
                      to={`/buyer/enquiries/new?listing=${listing.id}`}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-100 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Send Enquiry
                    </Link>
                    <button
                      onClick={() => setShowPayment(true)}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors shadow-md shadow-green-100 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Buy / Pay Now
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-colors text-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Request Callback
                    </button>
                  </div>
                )}

                {!user && (
                  <Link
                    to="/login"
                    state={{ from: `/listings/${listing.id}` }}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md text-sm"
                  >
                    Sign In to Enquire
                  </Link>
                )}

                {user?.role === 'seller' && listing.seller_email === user.email && (
                  <Link
                    to={`/seller/listings/${listing.id}`}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm"
                  >
                    Manage This Listing
                  </Link>
                )}
              </div>

              {/* Quick info card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Quick Info</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: '📍', label: 'Location', value: listing.location },
                    { icon: '🏷️', label: 'Type',     value: listing.listing_type === 'sale' ? 'For Sale' : 'For Rent' },
                    { icon: '📂', label: 'Category', value: listing.category_name },
                    { icon: '📅', label: 'Listed',   value: new Date(listing.created_at).toLocaleDateString() },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-base mb-1">{item.icon}</p>
                      <p className="text-[10px] text-gray-400">{item.label}</p>
                      <p className="text-xs font-bold text-gray-700 truncate">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map placeholder */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-green-100 via-blue-50 to-blue-100 relative flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 320 160">
                    {[0,40,80,120,160,200,240,280,320].map(x => (
                      <line key={x} x1={x} y1="0" x2={x} y2="160" stroke="#6b7280" strokeWidth="0.5" />
                    ))}
                    {[0,32,64,96,128,160].map(y => (
                      <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#6b7280" strokeWidth="0.5" />
                    ))}
                  </svg>
                  <div className="absolute top-6 left-16 w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  <div className="absolute bottom-10 right-20 w-5 h-5 bg-orange-500 rounded-full border-2 border-white shadow-md" />
                  <div className="bg-white rounded-xl px-3 py-2 shadow-lg border border-gray-100 z-10">
                    <p className="text-xs font-bold text-gray-900">{listing.location}</p>
                    <p className="text-[10px] text-blue-600 font-semibold">
                      ${Number(listing.price).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="px-4 py-2.5 flex items-center justify-between border-t border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">📍 {listing.location}</span>
                  <button className="text-xs text-blue-600 font-semibold hover:underline">View on map →</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Payment modal — rendered outside the page div so it overlays correctly */}
      {showPayment && (
        <PaymentModal listing={listing} onClose={() => setShowPayment(false)} />
      )}
    </>
  )
}
