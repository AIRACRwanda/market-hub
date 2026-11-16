import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'

const STATUS_STYLES = {
  pending:    'bg-yellow-100 text-yellow-800',
  successful: 'bg-green-100 text-green-800',
  failed:     'bg-red-100 text-red-800',
  cancelled:  'bg-gray-100 text-gray-600',
  refunded:   'bg-blue-100 text-blue-800',
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [statusFilter, setStatus]       = useState('')
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  const load = (s) => {
    setLoading(true)
    const params = s ? { status: s } : {}
    api.get('/transactions/admin/', { params })
      .then(({ data }) => setTransactions(data))
      .catch(() => setError('Failed to load transactions.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(statusFilter) }, [statusFilter])

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Transactions</h1>
            <p className="text-sm text-gray-400 mt-0.5">{transactions.length} records</p>
          </div>
          <Link to="/admin/dashboard" className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Dashboard
          </Link>
        </div>

        {/* Phase 8 banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
          <span className="text-2xl">🏗️</span>
          <div>
            <p className="font-bold text-amber-800 text-sm">Phase 8 — Payment Placeholder</p>
            <p className="text-amber-700 text-xs mt-1">
              Transaction model is fully structured and ready. No payment provider is connected yet — that's Phase 13 (Stripe/PayPal integration). All current transactions are <strong>pending</strong> stubs.
            </p>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6 bg-white rounded-2xl p-2 border border-gray-100 shadow-sm">
          {['', 'pending', 'successful', 'failed', 'cancelled', 'refunded'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors capitalize ${
                statusFilter === s ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              }`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 mb-5">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-24"><Spinner size="lg" /></div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16 text-gray-400">
            <div className="text-3xl mb-3">💳</div>
            <p className="font-semibold">No transactions found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Reference', 'Listing', 'Buyer', 'Seller', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{txn.reference_number}</td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-900 max-w-[160px] truncate">{txn.listing_title}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[120px]">{txn.buyer_email}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[120px]">{txn.seller_email}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-blue-600">${Number(txn.amount).toLocaleString()}</span>
                      <span className="text-gray-400 text-xs ml-1">{txn.currency}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[txn.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(txn.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
