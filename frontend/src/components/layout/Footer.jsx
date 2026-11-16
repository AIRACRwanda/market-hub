import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">

      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <span className="text-white font-extrabold text-lg leading-none">Market</span>
                <span className="text-blue-400 font-extrabold text-lg leading-none">Hub</span>
                <p className="text-[10px] text-gray-500 tracking-widest uppercase">Buy • Sell • Connect</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mt-3">
              A verified marketplace for properties, products, vehicles and services. Every listing reviewed before going live.
            </p>
          </div>

          {/* Explore */}
          <div>
            <p className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Explore</p>
            <ul className="space-y-2.5 text-sm">
              <FooterLink to="/listings"                    label="Browse Listings" />
              <FooterLink to="/listings?listing_type=sale"  label="For Sale" />
              <FooterLink to="/listings?listing_type=rent"  label="For Rent" />
              <FooterLink to="/listings?category=properties" label="Properties" />
              <FooterLink to="/listings?category=vehicles"   label="Vehicles" />
            </ul>
          </div>

          {/* Sellers */}
          <div>
            <p className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Sellers</p>
            <ul className="space-y-2.5 text-sm">
              <FooterLink to="/register?role=seller" label="Start Selling" />
              <FooterLink to="/seller/dashboard"     label="Seller Dashboard" />
              <FooterLink to="/seller/listings/new"  label="Post a Listing" />
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Account</p>
            <ul className="space-y-2.5 text-sm">
              <FooterLink to="/login"    label="Sign In" />
              <FooterLink to="/register" label="Create Account" />
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs">© {new Date().getFullYear()} MarketHub. All rights reserved.</p>
          <p className="text-blue-400 font-bold italic text-sm">Shop Smart. Live Better.</p>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ to, label }) {
  return (
    <li>
      <Link to={to} className="hover:text-white transition-colors hover:translate-x-1 inline-block">
        {label}
      </Link>
    </li>
  )
}
