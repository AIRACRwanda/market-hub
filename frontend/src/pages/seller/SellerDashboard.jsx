import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import StatusBadge from '../../components/ui/StatusBadge'

export default function SellerDashboard() {
  const { user } = useAuth()
  const [listings, setListings]   = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/listings/my/'),
      api.get('/enquiries/seller/'),
    ])
      .then(([l, e]) => { setListings(l.data); setEnquiries(e.data) })
      .finally(() => setLoading(false))
  }, [])

  const counts = {
    total:     listings.length,
    pending:   listings.filter(l => ['pending_review','proof_requested','under_review'].includes(l.status)).length,
    published: listings.filter(l => l.status === 'published').length,
    attention: listings.filter(l => ['rejected','proof_requested','expired'].includes(l.status)).length,
  }
  const unread = enquiries.filter(e => e.status === 'new').length

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
          </div>
          <Link to="/seller/listings/new"
            className="flex items-center gap-2 bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-100 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Submit Property
          </Link>
        </div>

        {/* Stat cards — HomeLengo style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: '🏠', label: 'Your Listings', value: counts.total,     sub: `${counts.pending} pending`,   bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-700' },
            { icon: '⏳', label: 'Pending',        value: counts.pending,   sub: 'awaiting review',             bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700' },
            { icon: '✅', label: 'Published',      value: counts.published, sub: 'live listings',               bg: 'bg-green-50',  border: 'border-green-100',  text: 'text-green-700' },
            { icon: '💬', label: 'Enquiries',      value: enquiries.length, sub: `${unread} new`,               bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700' },
          ].map(card => (
            <div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-5`}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{card.icon}</span>
                {card.label === 'Enquiries' && unread > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread} new</span>
                )}
                {card.label === 'Your Listings' && counts.attention > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{counts.attention} needs action</span>
                )}
              </div>
              <p className={`text-3xl font-extrabold ${card.text}`}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{card.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Two-column: listings table + enquiries inbox */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* New Listings table */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">New Listing</h2>
              <Link to="/seller/listings" className="text-xs text-blue-600 hover:underline font-semibold">View All →</Link>
            </div>

            {listings.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm mb-3">No listings yet</p>
                <Link to="/seller/listings/new" className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-blue-700">Create First Listing</Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Listing</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Status</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {listings.slice(0, 6).map(l => (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                            {l.images?.[0]
                              ? <img src={l.images[0].image} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">🏠</div>
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate max-w-[180px] text-xs">{l.title}</p>
                            <p className="text-gray-400 text-xs">${Number(l.price).toLocaleString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell"><StatusBadge status={l.status} /></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 text-xs">
                          <Link to={`/seller/listings/${l.id}`} className="text-blue-600 hover:underline font-medium">Edit</Link>
                          {l.status === 'published' && <span className="text-gray-300">·</span>}
                          {l.status === 'published' && <span className="text-green-600 font-medium">Live</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Enquiries inbox */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Messages</h2>
              <Link to="/seller/enquiries" className="text-xs text-blue-600 hover:underline font-semibold">View All →</Link>
            </div>

            {enquiries.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No messages yet</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {enquiries.slice(0, 6).map(e => (
                  <Link key={e.id} to={`/seller/enquiries/${e.id}`}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-700">
                      {e.buyer_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-800 truncate">{e.buyer_name}</p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{new Date(e.updated_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{e.listing_title}</p>
                      {e.status === 'new' && (
                        <span className="inline-block mt-1 w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Page insights chart placeholder */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Page Insights</h2>
            <div className="flex gap-1">
              {['Day', 'Week', 'Month', 'Year'].map(p => (
                <button key={p} className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors first:bg-blue-600 first:text-white">{p}</button>
              ))}
            </div>
          </div>
          {/* SVG chart placeholder */}
          <div className="h-32 relative">
            <svg viewBox="0 0 800 120" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0,30,60,90,120].map(y => <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#f3f4f6" strokeWidth="1"/>)}
              {/* Area fill */}
              <path d="M0,100 C50,90 100,70 150,65 C200,60 250,55 300,50 C350,45 400,40 450,35 C500,30 550,25 600,30 C650,35 700,45 750,40 C775,37 800,35 800,35 L800,120 L0,120 Z" fill="url(#chartGrad)"/>
              {/* Line */}
              <path d="M0,100 C50,90 100,70 150,65 C200,60 250,55 300,50 C350,45 400,40 450,35 C500,30 550,25 600,30 C650,35 700,45 750,40 C775,37 800,35 800,35" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
              {/* Peak dot */}
              <circle cx="550" cy="25" r="4" fill="#3b82f6"/>
              <rect x="510" y="5" width="80" height="22" rx="6" fill="#1d4ed8"/>
              <text x="550" y="19" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Peak</text>
            </svg>
            {/* Y labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-gray-300 pointer-events-none">
              {['High','','','','Low'].map((l,i) => <span key={i}>{l}</span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
