/**
 * PaymentModal — Phase 8 placeholder UI.
 * Shows the payment flow UI with a clear "placeholder" notice.
 * Phase 13 replaces the inner content with the real provider checkout.
 */
import { useState } from 'react'
import api from '../../api/axios'
import Spinner from './Spinner'

const STATUS_STYLES = {
  pending:    'bg-yellow-100 text-yellow-800',
  successful: 'bg-green-100 text-green-800',
  failed:     'bg-red-100 text-red-800',
  cancelled:  'bg-gray-100 text-gray-600',
  refunded:   'bg-blue-100 text-blue-800',
}

export default function PaymentModal({ listing, onClose }) {
  const [step, setStep]           = useState('confirm')   // confirm | processing | done
  const [transaction, setTxn]     = useState(null)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [currency, setCurrency]   = useState('USD')

  const initiate = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/transactions/initiate/', {
        listing: listing.id,
        currency,
      })
      setTxn(data)
      setStep('processing')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initiate payment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    /* Backdrop */
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-lg leading-none">Payment</p>
                <p className="text-blue-200 text-xs mt-0.5">Secure checkout</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">

          {/* Placeholder notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-amber-800 font-semibold text-xs">Payment Placeholder</p>
              <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
                Full payment integration (Stripe / PayPal) comes in Phase 13. This creates a pending transaction record for now.
              </p>
            </div>
          </div>

          {/* ── STEP: Confirm ── */}
          {step === 'confirm' && (
            <div className="space-y-5">
              {/* Listing summary */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Order Summary</p>
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                    {listing.images?.[0]
                      ? <img src={listing.images[0].image} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">🏠</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{listing.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">📍 {listing.location}</p>
                    <p className="text-blue-600 font-extrabold text-lg mt-1">${Number(listing.price).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Currency selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white">
                  <option value="USD">🇺🇸 USD — US Dollar</option>
                  <option value="EUR">🇪🇺 EUR — Euro</option>
                  <option value="GBP">🇬🇧 GBP — British Pound</option>
                  <option value="RWF">🇷🇼 RWF — Rwandan Franc</option>
                  <option value="KES">🇰🇪 KES — Kenyan Shilling</option>
                </select>
              </div>

              {/* Payment method placeholder */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                <div className="space-y-2">
                  {[
                    { icon: '💳', label: 'Credit / Debit Card',  sub: 'Visa, Mastercard, Amex',    disabled: true },
                    { icon: '🏦', label: 'Mobile Money',          sub: 'MTN, Airtel, M-Pesa',       disabled: true },
                    { icon: '🅿️', label: 'PayPal',               sub: 'Pay with PayPal account',   disabled: true },
                  ].map(method => (
                    <div key={method.label}
                      className="flex items-center gap-3 border border-gray-100 rounded-2xl px-4 py-3 opacity-50 cursor-not-allowed bg-gray-50">
                      <span className="text-xl">{method.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{method.label}</p>
                        <p className="text-xs text-gray-400">{method.sub} — coming in Phase 13</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3">{error}</div>
              )}

              {/* Total row */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-extrabold text-blue-600 text-xl">${Number(listing.price).toLocaleString()} {currency}</span>
              </div>

              <button onClick={initiate} disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-60 text-sm">
                {loading ? <Spinner size="sm" /> : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
                {loading ? 'Processing...' : 'Confirm & Pay (Placeholder)'}
              </button>
            </div>
          )}

          {/* ── STEP: Processing / Done ── */}
          {step === 'processing' && transaction && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-extrabold text-gray-900 text-lg">Transaction Created</p>
                <p className="text-gray-400 text-sm mt-1">Your transaction has been recorded as pending.</p>
              </div>

              {/* Transaction details */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left space-y-2">
                {[
                  { label: 'Reference',  value: transaction.transaction?.reference_number },
                  { label: 'Amount',     value: `$${Number(transaction.transaction?.amount).toLocaleString()} ${transaction.transaction?.currency}` },
                  { label: 'Status',     value: transaction.transaction?.status, badge: true },
                  { label: 'Provider',   value: 'Placeholder (Phase 13)' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{row.label}</span>
                    {row.badge ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[row.value] ?? 'bg-gray-100 text-gray-600'}`}>{row.value}</span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-800">{row.value}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-xs text-blue-700 leading-relaxed">
                {transaction.payment_stub?.note}
              </div>

              <button onClick={onClose}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl hover:bg-blue-700 transition-colors text-sm">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
