import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { HOME_BY_ROLE } from '@/hooks/useRole'
import type { Role } from '@/lib/types'
import { FullPageSpinner, ErrorState } from '@/components/ui/States'

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { session, initializing, me, meLoading, meError, signOut } = useAuth()
  const location = useLocation()

  if (initializing || meLoading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (meError || !me)
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <ErrorState
          title="We couldn't load your account"
          message={meError?.message ?? 'Your profile is missing. Contact the placement cell.'}
          action={{ label: 'Sign out', onClick: signOut }}
        />
      </div>
    )
  if (roles && !roles.includes(me.profile.role)) return <Navigate to={HOME_BY_ROLE[me.profile.role]} replace />
  return <Outlet />
}
