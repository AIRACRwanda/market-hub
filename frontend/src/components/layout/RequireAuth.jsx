import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../ui/Spinner'

/**
 * Wraps a route that requires authentication.
 * If `roles` is provided, the user must have one of those roles.
 */
export default function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  if (user.is_disabled) {
    return (
      <div className="flex justify-center items-center min-h-screen px-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <p className="text-red-800 font-semibold text-lg mb-2">Account Disabled</p>
          <p className="text-red-700 text-sm">Your account has been disabled. Please contact support.</p>
        </div>
      </div>
    )
  }

  return children
}
