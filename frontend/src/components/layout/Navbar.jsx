import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* ── LOGO ── */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          {/* Bag + golden orbit ring, matches reference exactly */}
          <div className="relative w-10 h-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            {/* Golden orbit ring */}
            <div className="absolute -bottom-1 -left-1.5 w-[52px] h-[14px] border-2 border-yellow-400 rounded-full"
              style={{ transform: 'rotate(-8deg)' }} />
          </div>
          <div className="leading-none">
            <div>
              <span className="text-blue-600 font-extrabold text-lg">Rwanda</span>
              <span className="text-gray-900 font-extrabold text-lg">Market</span>
            </div>
            <p className="text-[10px] text-gray-400 tracking-widest mt-0.5">Buy • Sell • Connect</p>
          </div>
        </Link>

        {/* ── DESKTOP NAV ── */}
        <nav className="hidden md:flex items-center gap-1">

          {/* Home — pill highlight when active */}
          <NavLink to="/"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`
            }
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
            </svg>
            Home
          </NavLink>

          {/* Browse — with grid dots icon */}
          <NavLink to="/listings"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`
            }
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="5" cy="5" r="1.5" /><circle cx="12" cy="5" r="1.5" /><circle cx="19" cy="5" r="1.5" />
              <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
              <circle cx="5" cy="19" r="1.5" /><circle cx="12" cy="19" r="1.5" /><circle cx="19" cy="19" r="1.5" />
            </svg>
            Browse
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </NavLink>

          <span className="text-sm font-medium text-gray-600 px-3 py-2 hover:text-blue-600 cursor-pointer">About</span>
          <span className="text-sm font-medium text-gray-600 px-3 py-2 hover:text-blue-600 cursor-pointer">Contact</span>

          {/* Role-based links */}
          {user?.role === 'buyer'  && <NavLink to="/buyer/enquiries"  className="text-sm font-medium text-gray-600 px-3 py-2 hover:text-blue-600">Enquiries</NavLink>}
          {user?.role === 'seller' && <NavLink to="/seller/dashboard" className="text-sm font-medium text-gray-600 px-3 py-2 hover:text-blue-600">Dashboard</NavLink>}
          {user?.role === 'admin'  && <NavLink to="/admin/dashboard"  className="text-sm font-medium text-gray-600 px-3 py-2 hover:text-blue-600">Admin</NavLink>}
        </nav>

        {/* ── RIGHT SIDE ── */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">

          {/* Globe / language */}
          <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">EN</span>
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {!user ? (
            /* Sign Up button — outlined with user icon, exactly like reference */
            <Link to="/register"
              className="flex items-center gap-1.5 border-2 border-blue-600 text-blue-600 font-bold text-sm px-4 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Sign Up
            </Link>
          ) : (
            /* User avatar dropdown */
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-gray-100 transition-colors">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  {user.first_name?.[0]?.toUpperCase() ?? 'U'}
                </span>
                <span className="text-sm font-semibold text-gray-700 max-w-[90px] truncate">{user.first_name}</span>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-20">
                    <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold capitalize">{user.role}</span>
                    </div>
                    {user.role === 'seller' && <DropLink to="/seller/dashboard" label="Dashboard" close={() => setUserMenuOpen(false)} />}
                    {user.role === 'seller' && <DropLink to="/seller/listings"  label="My Listings" close={() => setUserMenuOpen(false)} />}
                    {user.role === 'buyer'  && <DropLink to="/buyer/enquiries"    label="My Enquiries"    close={() => setUserMenuOpen(false)} />}
                    {user.role === 'buyer'  && <DropLink to="/buyer/transactions"  label="My Transactions" close={() => setUserMenuOpen(false)} />}
                    {user.role === 'admin'  && <DropLink to="/admin/dashboard"  label="Admin Panel" close={() => setUserMenuOpen(false)} />}
                    <button onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100 mt-1 font-medium">
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── MOBILE HAMBURGER ── */}
        <button className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen
            ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          }
        </button>
      </div>

      {/* ── MOBILE MENU ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-1 shadow-lg">
          {[
            { to: '/',        label: 'Home' },
            { to: '/listings', label: 'Browse' },
          ].map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`
              }>{item.label}</NavLink>
          ))}
          {user?.role === 'seller' && <NavLink to="/seller/dashboard" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">Dashboard</NavLink>}
          {user?.role === 'buyer'  && <NavLink to="/buyer/enquiries"  onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">Enquiries</NavLink>}
          {user?.role === 'admin'  && <NavLink to="/admin/dashboard"  onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">Admin</NavLink>}
          <div className="border-t border-gray-100 pt-3 mt-2 flex flex-col gap-2">
            {!user ? (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl">Sign In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="w-full text-center bg-blue-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-blue-700">Sign Up</Link>
              </>
            ) : (
              <button onClick={handleLogout} className="text-left text-sm text-red-600 font-medium px-3 py-2.5 hover:bg-red-50 rounded-xl">Sign Out</button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

function DropLink({ to, label, close }) {
  return (
    <Link to={to} onClick={close} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">
      {label}
    </Link>
  )
}
