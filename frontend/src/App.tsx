import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AppShell } from '@/layouts/AppShell'
import { FullPageSpinner } from '@/components/ui/States'
import { useAuth } from '@/hooks/useAuth'
import { HOME_BY_ROLE } from '@/hooks/useRole'
import Login from '@/pages/Login'

import StudentHome from '@/pages/student/Home'
import StudentDrives from '@/pages/student/Drives'
import StudentApplications from '@/pages/student/Applications'
import StudentProfile from '@/pages/student/Profile'

// Staff screens are code-split; most traffic is students on phones.
const FacultyAttendance = lazy(() => import('@/pages/faculty/Attendance'))
const FacultyStudents = lazy(() => import('@/pages/faculty/Students'))
const FacultyInterviews = lazy(() => import('@/pages/faculty/Interviews'))
const DeanAnalytics = lazy(() => import('@/pages/dean/Analytics'))
const DeanDrives = lazy(() => import('@/pages/dean/Drives'))
const DeanAssignments = lazy(() => import('@/pages/dean/Assignments'))
const AdminUsers = lazy(() => import('@/pages/admin/Users'))
const AdminBatches = lazy(() => import('@/pages/admin/Batches'))

function RoleRedirect() {
  const { session, initializing, me, meLoading } = useAuth()
  if (initializing || meLoading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace />
  return <Navigate to={me ? HOME_BY_ROLE[me.profile.role] : '/login'} replace />
}

export default function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RoleRedirect />} />

        <Route element={<ProtectedRoute roles={['student']} />}>
          <Route path="/student" element={<AppShell />}>
            <Route index element={<StudentHome />} />
            <Route path="drives" element={<StudentDrives />} />
            <Route path="applications" element={<StudentApplications />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['faculty']} />}>
          <Route path="/faculty" element={<AppShell />}>
            <Route index element={<Navigate to="attendance" replace />} />
            <Route path="attendance" element={<FacultyAttendance />} />
            <Route path="students" element={<FacultyStudents />} />
            <Route path="interviews" element={<FacultyInterviews />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['dean', 'admin']} />}>
          <Route path="/dean" element={<AppShell />}>
            <Route index element={<Navigate to="analytics" replace />} />
            <Route path="analytics" element={<DeanAnalytics />} />
            <Route path="drives" element={<DeanDrives />} />
            <Route path="assignments" element={<DeanAssignments />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/admin" element={<AppShell />}>
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="batches" element={<AdminBatches />} />
          </Route>
        </Route>

        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </Suspense>
  )
}
