import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

const CATEGORIES = [
  {
    label: 'Products',
    to: '/listings?listing_type=sale',
    iconBg: 'bg-blue-50',
    icon: (
      <svg className="w-9 h-9 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    label: 'Properties',
    to: '/listings?category=properties',
    iconBg: 'bg-green-50',
    icon: (
      <svg className="w-9 h-9 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    label: 'Vehicles',
    to: '/listings?category=vehicles',
    iconBg: 'bg-orange-50',
    icon: (
      <svg className="w-9 h-9 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h1m8 0H9m4 0h5m-5 0V9a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414A1 1 0 0120 11.414V16h-1" />
      </svg>
    ),
  },
  {
    label: 'Services',
    to: '/listings?category=services',
    iconBg: 'bg-purple-50',
    icon: (
      <svg className="w-9 h-9 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-1a4 4 0 00-3-3.87M9 20H4v-1a4 4 0 013-3.87m6-5.13a4 4 0 100-8 4 4 0 000 8zm6 2a3 3 0 00-3-3M6 14a3 3 0 013-3" />
      </svg>
    ),
  },
]

const TRUST_ITEMS = [
  {
    icon: (
      <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    label: 'Secure & Reliable',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Verified Sellers',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    label: '24/7 Support',
  },
  {
    // Globe / world icon for "Proudly [Platform]"
    icon: (
      <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Proudly Global',
  },
]

// ─────────────────────────────────────────────
// PAGE ROOT
// ─────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <TrustBar />
      <HowItWorksSection />
      <CtaBanner />
    </div>
  )
}

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────

function HeroSection() {
  return (
    /*
      Full-viewport hero.
      We use a sky-blue-to-white gradient as the "city" sky backdrop since
      we don't have a real photo asset — it still matches the colour mood
      of the reference perfectly. The white card floats on top-right.
    */
    <section className="relative overflow-hidden min-h-[560px]"
      style={{
        background: 'linear-gradient(135deg, #0a2d6e 0%, #1a56b0 40%, #3b8de0 70%, #7ec8f0 100%)',
      }}
    >
      {/* ── Sky layers & scenery illusion ── */}
      {/* Soft cloud blobs */}
      <div className="absolute top-6 left-1/4 w-48 h-16 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute top-12 left-1/2 w-64 h-20 bg-white/10 rounded-full blur-2xl" />

      {/* Hill / landscape silhouette at bottom-left */}
      <div
        className="absolute bottom-0 left-0 right-0 h-36 opacity-20"
        style={{
          background: 'linear-gradient(to top, #0a2d6e, transparent)',
        }}
      />

      {/* ── Floating product icons bottom-left (phone, laptop, house, car, bag) ── */}
      <div className="absolute bottom-10 left-4 sm:left-16 flex items-end gap-3 pointer-events-none select-none">
        {/* Phone */}
        <div className="w-14 h-24 bg-white/90 rounded-2xl shadow-xl flex items-center justify-center border border-white/60">
          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        {/* House */}
        <div className="w-20 h-16 bg-white/90 rounded-2xl shadow-xl flex items-center justify-center border border-white/60">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
          </svg>
        </div>
        {/* Car */}
        <div className="w-24 h-14 bg-white/90 rounded-2xl shadow-xl flex items-center justify-center border border-white/60">
          <svg className="w-12 h-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h1m8 0H9m4 0h5m-5 0V9a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414A1 1 0 0120 11.414V16h-1" />
          </svg>
        </div>
        {/* Bag */}
        <div className="w-14 h-20 bg-yellow-400/90 rounded-2xl shadow-xl flex items-center justify-center border border-yellow-300/60">
          <svg className="w-7 h-7 text-yellow-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
      </div>

      {/* ── Main content grid ── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 pb-32 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* LEFT — headline + categories */}
          <div className="text-white pt-2">
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-none tracking-tight mb-2">
              <span className="text-white">Multi-Vendor</span>
              <br />
              <span className="text-blue-200">Marketplace</span>
            </h1>

            {/* Underline accent exactly like reference */}
            <div className="relative inline-block mb-4 mt-1">
              <p className="text-xl sm:text-2xl font-semibold italic text-white/90">
                Discover. Buy. Sell. Grow Together.
              </p>
              <div className="absolute -bottom-1 left-0 w-3/4 h-0.5 bg-yellow-400 rounded-full" />
            </div>

            <p className="text-white/80 text-base mt-5 mb-8 max-w-md leading-relaxed">
              A trusted platform to find products, properties,
              vehicles and services from verified sellers.
            </p>

            {/* Category boxes — exactly 4 white rounded boxes in a row */}
            <div className="flex gap-3 flex-wrap">
              {CATEGORIES.map(cat => (
                <Link
                  key={cat.label}
                  to={cat.to}
                  className="flex flex-col items-center justify-center gap-2 bg-white rounded-2xl px-4 py-3 w-[88px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.iconBg}`}>
                    {cat.icon}
                  </div>
                  <span className="text-xs font-semibold text-gray-700 text-center">{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* RIGHT — login card */}
          <div className="flex justify-center lg:justify-end">
            <LoginCard />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// LOGIN CARD  (floating white card on the right)
// ─────────────────────────────────────────────

function LoginCard() {
  const { login, user } = useAuth()
  const navigate        = useNavigate()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  /* ── Already logged in ── */
  if (user) {
    const dest = user.role === 'seller' ? '/seller/dashboard'
               : user.role === 'admin'  ? '/admin/dashboard'
               : '/listings'
    return (
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-2xl font-bold text-white">{user.first_name?.[0]?.toUpperCase()}</span>
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-1">Welcome back, {user.first_name}!</h2>
        <p className="text-gray-400 text-sm mb-5 capitalize">{user.role} account</p>
        <Link to={dest}
          className="block w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md">
          Go to {user.role === 'seller' ? 'Dashboard' : user.role === 'admin' ? 'Admin Panel' : 'Browse Listings'}
        </Link>
        <Link to="/listings" className="block mt-3 text-sm text-blue-600 hover:underline">
          Browse Listings
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/users/auth/login/', form)
      login(data.user, data.tokens)
      const role = data.user.role
      navigate(role === 'seller' ? '/seller/dashboard' : role === 'admin' ? '/admin/dashboard' : '/listings')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-7 w-full max-w-sm border border-gray-100">

      {/* Logo + heading */}
      <div className="flex flex-col items-center mb-6">
        {/* Shopping bag with golden orbit ring — matches reference icon */}
        <div className="relative mb-3">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          {/* Golden ellipse orbit ring */}
          <div className="absolute -bottom-1 -left-2 w-20 h-5 border-2 border-yellow-400 rounded-full opacity-80" style={{ transform: 'rotate(-10deg)' }} />
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 mt-1">Welcome Back!</h2>
        <p className="text-gray-500 text-sm mt-0.5">Sign in to your account</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-2.5 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">

        {/* Email field */}
        <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
          <div className="pl-3 pr-2 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <input
            type="email" required value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="Email address or Phone number"
            className="flex-1 py-3 pr-4 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Password field */}
        <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
          <div className="pl-3 pr-2 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            type={showPass ? 'text' : 'password'} required value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Password"
            className="flex-1 py-3 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
          />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="pr-3 text-gray-400 hover:text-gray-600">
            {showPass
              ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            }
          </button>
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600" />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>
          <Link to="/login" className="text-sm text-blue-600 font-medium hover:underline">
            Forgot password?
          </Link>
        </div>

        {/* Log In button */}
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md disabled:opacity-60 text-sm mt-1">
          {loading ? <Spinner size="sm" /> : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" />
            </svg>
          )}
          {loading ? 'Signing in...' : 'Log In'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Social login block — dark background exactly as in reference */}
      <div className="bg-gray-900 rounded-2xl px-4 py-4 text-center">
        <p className="text-gray-400 text-xs font-medium mb-3">Log In With</p>
        <div className="flex items-center justify-center gap-3">
          {/* Facebook */}
          <SocialBtn label="Facebook" bg="bg-blue-600" href="/login">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
            </svg>
          </SocialBtn>
          {/* X / Twitter */}
          <SocialBtn label="X" bg="bg-black" href="/login">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </SocialBtn>
          {/* Google */}
          <SocialBtn label="Google" bg="bg-white border border-gray-200" href="/login">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </SocialBtn>
          {/* LinkedIn */}
          <SocialBtn label="LinkedIn" bg="bg-blue-700" href="/login">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </SocialBtn>
        </div>
      </div>

      {/* Sign up */}
      <p className="text-center text-sm text-gray-500 mt-4">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-600 font-bold hover:underline">Sign Up</Link>
      </p>
    </div>
  )
}

function SocialBtn({ bg, href, children, label }) {
  return (
    <a href={href} aria-label={label}
      className={`w-10 h-10 rounded-full flex items-center justify-center ${bg} hover:opacity-90 transition-opacity shadow-sm`}>
      {children}
    </a>
  )
}

// ─────────────────────────────────────────────
// TRUST BAR  (white background, bottom of hero)
// ─────────────────────────────────────────────

function TrustBar() {
  return (
    <div className="bg-white border-t border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-y-3 py-3">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {TRUST_ITEMS.map(item => (
              <div key={item.label} className="flex items-center gap-2">
                {item.icon}
                <span className="text-sm font-semibold text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
          {/* "Shop Smart. Live Better." — dark blue pill on the right */}
          <div className="hidden sm:flex items-center bg-blue-700 text-white text-sm font-bold italic px-5 py-2 rounded-full shadow-sm ml-auto">
            Shop Smart. Live Better.
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// HOW IT WORKS
// ─────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    { num: '01', colour: 'bg-blue-600',   title: 'Create Account',    desc: 'Register as buyer or seller in under a minute.' },
    { num: '02', colour: 'bg-purple-600', title: 'Post or Browse',     desc: 'Sellers submit listings. Buyers search with smart filters.' },
    { num: '03', colour: 'bg-orange-500', title: 'Admin Verifies',     desc: 'Every listing is reviewed before it goes live.' },
    { num: '04', colour: 'bg-green-600',  title: 'Connect & Deal',     desc: 'Send enquiries, request viewings, and close deals.' },
  ]
  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900">How It Works</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">
            From listing to deal — a simple, verified process that keeps both buyers and sellers safe.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(s => (
            <div key={s.num} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${s.colour} rounded-2xl flex items-center justify-center text-white font-extrabold text-lg mb-4 shadow-sm`}>
                {s.num}
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-sm">{s.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/register"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md text-sm">
            Get Started Free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// CTA BANNER
// ─────────────────────────────────────────────

function CtaBanner() {
  return (
    <section className="bg-blue-700 py-12">
      <div className="max-w-4xl mx-auto px-4 text-center text-white">
        <h2 className="text-3xl font-extrabold mb-3">Ready to sell or find something?</h2>
        <p className="text-blue-200 mb-7 text-sm">
          Join thousands of buyers and verified sellers on MarketHub today.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/listings"
            className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-md text-sm">
            Browse Listings
          </Link>
          <Link to="/register?role=seller"
            className="border-2 border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-600 transition-colors text-sm">
            Start Selling
          </Link>
        </div>
      </div>
    </section>
  )
}
