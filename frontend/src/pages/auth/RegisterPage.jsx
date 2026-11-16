import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Pre-select role from query param (?role=seller)
  const [role, setRole] = useState(searchParams.get('role') === 'seller' ? 'seller' : 'buyer')

  // For the seller "already have an account" upgrade flow
  const [isUpgrade, setIsUpgrade] = useState(false)

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', confirm_password: '', business_name: '', bio: '',
  })
  const [errors, setErrors] = useState({})
  const [globalError, setGlobalError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setGlobalError('')
    setLoading(true)

    try {
      let endpoint
      if (role === 'buyer')          endpoint = '/users/register/buyer/'
      else if (isUpgrade)            endpoint = '/users/register/seller/upgrade/'
      else                           endpoint = '/users/register/seller/'

      const { data } = await api.post(endpoint, form)
      login(data.user, data.tokens)

      if (data.user.role === 'seller') navigate('/seller/dashboard')
      else navigate('/')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        // Field-level errors
        const fieldErrors = {}
        let hasGlobal = false
        for (const [key, val] of Object.entries(data)) {
          if (key === 'detail' || key === 'non_field_errors') {
            setGlobalError(Array.isArray(val) ? val.join(' ') : val)
            hasGlobal = true
          } else {
            fieldErrors[key] = Array.isArray(val) ? val.join(' ') : val
          }
        }
        setErrors(fieldErrors)
        if (!hasGlobal && Object.keys(fieldErrors).length === 0) {
          setGlobalError('Registration failed. Please try again.')
        }
      } else {
        setGlobalError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[key] ? 'border-red-400' : 'border-gray-300'}`}
      />
      {errors[key] && <p className="text-xs text-red-600 mt-1">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
        <p className="text-sm text-gray-500 mb-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Sign In</Link>
        </p>

        {/* Role toggle */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => { setRole('buyer'); setIsUpgrade(false) }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${role === 'buyer' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
          >
            Buyer
          </button>
          <button
            type="button"
            onClick={() => setRole('seller')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${role === 'seller' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
          >
            Seller
          </button>
        </div>

        {/* Seller: existing account toggle */}
        {role === 'seller' && (
          <div className="mb-5 p-4 bg-blue-50 rounded-xl text-sm text-gray-700">
            Do you already have a buyer account?{' '}
            <button
              type="button"
              onClick={() => setIsUpgrade(!isUpgrade)}
              className="text-blue-600 font-semibold hover:underline"
            >
              {isUpgrade ? 'No, create new account' : 'Yes, upgrade my account'}
            </button>
          </div>
        )}

        <Alert type="error" message={globalError} />

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Upgrade flow — just needs identifier + password */}
          {isUpgrade ? (
            <>
              <p className="text-sm text-gray-500">Enter your existing account email or phone and password.</p>
              {field('email', 'Email', 'email', 'your@email.com')}
              {field('phone', 'Phone (alternative)', 'tel', '+1234567890')}
              {field('password', 'Password', 'password', '••••••••')}
              {field('business_name', 'Business Name (optional)')}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                {field('first_name', 'First Name', 'text', 'John')}
                {field('last_name', 'Last Name', 'text', 'Smith')}
              </div>
              {field('email', 'Email', 'email', 'you@example.com')}
              {field('phone', 'Phone (optional)', 'tel', '+1234567890')}
              {field('password', 'Password', 'password', '••••••••')}
              {field('confirm_password', 'Confirm Password', 'password', '••••••••')}
              {role === 'seller' && (
                <>
                  {field('business_name', 'Business Name (optional)')}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio (optional)</label>
                    <textarea
                      value={form.bio}
                      onChange={e => set('bio', e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Tell buyers a bit about yourself..."
                    />
                  </div>
                </>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
          >
            {loading && <Spinner size="sm" />}
            {isUpgrade ? 'Upgrade to Seller' : `Create ${role === 'seller' ? 'Seller' : 'Buyer'} Account`}
          </button>
        </form>
      </div>
    </div>
  )
}
