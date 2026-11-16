import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/ui/Spinner'

const STATUS_STYLES = {
  pending:    { cls: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  successful: { cls: 'bg-green-100 text-green-800',  icon: '✅' },
  failed:     { cls: 'bg-red-100 text-red-800',      icon: '❌' },
  cancelled:  { cls: 'bg-gray-100 text-gray-600',    icon: '🚫' },
  refunded:   { cls: 'bg-blue-100 text-blue-800',    icon: '↩️' },
}

export default function BuyerTransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  useEffect(() => {
    api.get('/transactions/my/')
      .then(({ data }) => setTransactions(data))
      .catch(() => setError('Failed to load transactions.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">My Transactions</h1>
            <p className="text-sm text-gray-400 mt-0.5">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/listings"
            className="flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 text-sm shadow-md shadow-blue-100">
            Browse Listings
          </Link>
        </div>

        {/* Phase 8 notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
          <span className="text-2xl">🏗️</span>
          <div>
            <p className="font-bold text-amber-800 text-sm">Payment Integration — Phase 8 Placeholder</p>
            <p className="text-amber-700 text-xs mt-1 leading-relaxed">
              Transactions are recorded but no real payment provider is connected yet.
              Full Stripe/PayPal integration arrives in Phase 13. All transactions here have status <strong>pending</strong>.
            </p>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 mb-5">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-24"><Spinner size="lg" /></div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-20">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">💳</div>
            <p className="text-lg font-bold text-gray-700 mb-1">No transactions yet</p>
            <p className="text-sm text-gray-400 mb-5">When you initiate a payment on a listing, it will appear here.</p>
            <Link to="/listings" className="bg-blue-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 inline-block">
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(txn => {
              const style = STATUS_STYLES[txn.status] ?? { cls: 'bg-gray-100 text-gray-600', icon: '?' }
              return (
                <div key={txn.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Icon */}
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl">
                        {style.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{txn.listing_title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{txn.reference_number}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Seller: <span className="text-gray-600">{txn.seller_email}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(txn.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="text-blue-600 font-extrabold text-lg">${Number(txn.amount).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{txn.currency}</p>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${style.cls}`}>
                        {txn.status}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
