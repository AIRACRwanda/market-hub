import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'
import StatusBadge from '../../components/ui/StatusBadge'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats]     = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/stats/'),
      api.get('/listings/admin/', { params: { status: 'pending_review' } }),
    ])
      .then(([s, l]) => { setStats(s.data); setListings(l.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
          </div>
          <Link to="/admin/listings"
            className="flex items-center gap-2 bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-100 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Review Listings
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: '👥', label: 'Total Users',    value: stats.users.total,              sub: `${stats.users.sellers} sellers`,          bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-700' },
              { icon: '⏳', label: 'Pending Review', value: stats.listings.pending_review,  sub: 'awaiting your review',                     bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600' },
              { icon: '✅', label: 'Published',      value: stats.listings.published,       sub: 'live on the platform',                     bg: 'bg-green-50',  border: 'border-green-100',  text: 'text-green-700' },
              { icon: '🚨', label: 'Open Reports',   value: stats.reports.open,             sub: 'need attention',                           bg: 'bg-red-50',    border: 'border-red-100',    text: 'text-red-600' },
            ].map(card => (
              <div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-5`}>
                <span className="text-2xl block mb-2">{card.icon}</span>
                <p className={`text-3xl font-extrabold ${card.text}`}>{card.value ?? 0}</p>
                <p className="text-xs text-gray-600 font-semibold mt-0.5">{card.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Two-column: pending listings + nav cards */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Pending listings table */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Pending Listings</h2>
              <Link to="/admin/listings" className="text-xs text-blue-600 hover:underline font-semibold">View All →</Link>
            </div>
            {listings.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No pending listings 🎉</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Listing</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Seller</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Action</th>
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
                            <p className="font-semibold text-gray-800 truncate max-w-[160px] text-xs">{l.title}</p>
                            <p className="text-gray-400 text-xs">${Number(l.price).toLocaleString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500 hidden sm:table-cell truncate max-w-[100px]">{l.seller_email}</td>
                      <td className="px-3 py-3"><StatusBadge status={l.status} /></td>
                      <td className="px-3 py-3">
                        <Link to={`/admin/listings/${l.id}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline">
                          Review →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick nav cards */}
          <div className="space-y-3">
            {[
              { to: '/admin/listings',      icon: '🏠', label: 'All Listings',   sub: `${stats?.listings.total ?? 0} total`,           colour: 'bg-blue-50 border-blue-100' },
              { to: '/admin/users',         icon: '👥', label: 'Users',           sub: `${stats?.users.total ?? 0} registered`,         colour: 'bg-purple-50 border-purple-100' },
              { to: '/admin/reports',       icon: '🚨', label: 'Reports',         sub: `${stats?.reports.open ?? 0} open`,              colour: 'bg-red-50 border-red-100' },
              { to: '/admin/transactions',  icon: '💳', label: 'Transactions',    sub: 'Payment records',                               colour: 'bg-green-50 border-green-100' },
              { to: '/admin/audit-log',     icon: '📋', label: 'Audit Log',       sub: 'All admin actions',                             colour: 'bg-gray-50 border-gray-200' },
            ].map(card => (
              <Link key={card.to} to={card.to}
                className={`flex items-center gap-4 ${card.colour} border rounded-2xl px-4 py-3.5 hover:shadow-sm transition-all`}>
                <span className="text-2xl">{card.icon}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{card.label}</p>
                  <p className="text-xs text-gray-400">{card.sub}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}

            {/* Listings breakdown */}
            {stats && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Listing Status Breakdown</p>
                {[
                  { label: 'Published',       value: stats.listings.published,       colour: 'bg-green-500' },
                  { label: 'Pending Review',  value: stats.listings.pending_review,  colour: 'bg-yellow-500' },
                  { label: 'Proof Requested', value: stats.listings.proof_requested, colour: 'bg-orange-500' },
                  { label: 'Rejected',        value: stats.listings.rejected,        colour: 'bg-red-500' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${row.colour}`} />
                      <span className="text-xs text-gray-600">{row.label}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-800">{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
