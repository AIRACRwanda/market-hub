import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

// Layout
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import RequireAuth from './components/layout/RequireAuth'

// Public pages
import HomePage from './pages/public/HomePage'
import ListingsPage from './pages/public/ListingsPage'
import ListingDetailPage from './pages/public/ListingDetailPage'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Seller pages
import SellerDashboard from './pages/seller/SellerDashboard'
import SellerListingsPage from './pages/seller/SellerListingsPage'
import CreateListingPage from './pages/seller/CreateListingPage'
import ManageListingPage from './pages/seller/ManageListingPage'
import SellerEnquiriesPage from './pages/seller/SellerEnquiriesPage'
import SellerEnquiryDetailPage from './pages/seller/SellerEnquiryDetailPage'

// Buyer pages
import BuyerEnquiriesPage from './pages/buyer/BuyerEnquiriesPage'
import BuyerEnquiryDetailPage from './pages/buyer/BuyerEnquiryDetailPage'
import SendEnquiryPage from './pages/buyer/SendEnquiryPage'
import BuyerTransactionsPage from './pages/buyer/BuyerTransactionsPage'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminListingsPage from './pages/admin/AdminListingsPage'
import AdminListingReviewPage from './pages/admin/AdminListingReviewPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminAuditLogPage from './pages/admin/AdminAuditLogPage'
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage'

function PageLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ----------------------------------------------------------------
              Public routes — layout with navbar + footer
          ---------------------------------------------------------------- */}
          <Route path="/" element={<PageLayout><HomePage /></PageLayout>} />
          <Route path="/listings" element={<PageLayout><ListingsPage /></PageLayout>} />
          <Route path="/listings/:id" element={<PageLayout><ListingDetailPage /></PageLayout>} />

          {/* ----------------------------------------------------------------
              Auth — no footer needed, full-screen centered forms
          ---------------------------------------------------------------- */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ----------------------------------------------------------------
              Seller routes
          ---------------------------------------------------------------- */}
          <Route
            path="/seller/dashboard"
            element={
              <RequireAuth roles={['seller']}>
                <PageLayout><SellerDashboard /></PageLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/seller/listings"
            element={
              <RequireAuth roles={['seller']}>
                <PageLayout><SellerListingsPage /></PageLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/seller/listings/new"
            element={
              <RequireAuth roles={['seller']}>
                <PageLayout><CreateListingPage /></PageLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/seller/listings/:id"
            element={
              <RequireAuth roles={['seller']}>
                <PageLayout><ManageListingPage /></PageLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/seller/enquiries"
            element={
              <RequireAuth roles={['seller']}>
                <PageLayout><SellerEnquiriesPage /></PageLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/seller/enquiries/:id"
            element={
              <RequireAuth roles={['seller']}>
                <PageLayout><SellerEnquiryDetailPage /></PageLayout>
              </RequireAuth>
            }
          />

          {/* ----------------------------------------------------------------
              Buyer routes
          ---------------------------------------------------------------- */}
          <Route
            path="/buyer/enquiries"
            element={
              <RequireAuth roles={['buyer']}>
                <PageLayout><BuyerEnquiriesPage /></PageLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/buyer/enquiries/new"
            element={
              <RequireAuth roles={['buyer']}>
                <PageLayout><SendEnquiryPage /></PageLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/buyer/enquiries/:id"
            element={
              <RequireAuth roles={['buyer']}>
                <PageLayout><BuyerEnquiryDetailPage /></PageLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/buyer/transactions"
            element={
              <RequireAuth roles={['buyer']}>
                <PageLayout><BuyerTransactionsPage /></PageLayout>
              </RequireAuth>
            }
          />

          {/* ----------------------------------------------------------------
              Admin routes
          ---------------------------------------------------------------- */}
          <Route
            path="/admin/dashboard"
            element={
              <RequireAuth roles={['admin']}>
                <PageLayout><AdminDashboard /></PageLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/listings"
            element={
              <RequireAuth roles={['admin']}>
                <PageLayout><AdminListingsPage /></PageLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/listings/:id"
            element={
              <RequireAuth roles={['admin']}>
                <PageLayout><AdminListingReviewPage /></PageLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireAuth roles={['admin']}>
                <PageLayout><AdminUsersPage /></PageLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <RequireAuth roles={['admin']}>
                <PageLayout><AdminReportsPage /></PageLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/audit-log"
            element={
              <RequireAuth roles={['admin']}>
                <PageLayout><AdminAuditLogPage /></PageLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <RequireAuth roles={['admin']}>
                <PageLayout><AdminTransactionsPage /></PageLayout>
              </RequireAuth>
            }
          />

          {/* ----------------------------------------------------------------
              404
          ---------------------------------------------------------------- */}
          <Route
            path="*"
            element={
              <PageLayout>
                <div className="flex flex-col items-center justify-center py-32 text-center px-4">
                  <p className="text-6xl font-extrabold text-blue-200 mb-4">404</p>
                  <p className="text-xl font-semibold text-gray-700 mb-2">Page not found</p>
                  <a href="/" className="text-blue-600 hover:underline text-sm mt-2">Go home</a>
                </div>
              </PageLayout>
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
