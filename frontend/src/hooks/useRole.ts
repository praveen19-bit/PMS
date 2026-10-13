import { useAuth } from './useAuth'
import type { Role } from '@/lib/types'

export const HOME_BY_ROLE: Record<Role, string> = {
  student: '/student',
  faculty: '/faculty/attendance',
  dean: '/dean/analytics',
  admin: '/admin/users',
}

export function useRole() {
  const { me } = useAuth()
  const role = me?.profile.role
  return {
    role,
    is: (...roles: Role[]) => Boolean(role && roles.includes(role)),
    home: role ? HOME_BY_ROLE[role] : '/login',
  }
}
