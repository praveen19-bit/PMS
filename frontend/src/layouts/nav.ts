import {
  BarChart3, Briefcase, CalendarCheck, GraduationCap, Home, Layers, Link2, ListChecks, MessagesSquare,
  UserRound, Users, type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/lib/types'

export interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean }

export const NAV: Record<Role, NavItem[]> = {
  student: [
    { to: '/student', label: 'Home', icon: Home, end: true },
    { to: '/student/drives', label: 'Drives', icon: Briefcase },
    { to: '/student/applications', label: 'Applications', icon: ListChecks },
    { to: '/student/profile', label: 'Profile', icon: UserRound },
  ],
  faculty: [
    { to: '/faculty/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/faculty/students', label: 'Students', icon: GraduationCap },
    { to: '/faculty/interviews', label: 'Interviews', icon: MessagesSquare },
  ],
  dean: [
    { to: '/dean/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/dean/drives', label: 'Drives', icon: Briefcase },
    { to: '/dean/assignments', label: 'Assignments', icon: Link2 },
  ],
  admin: [
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/batches', label: 'Batches', icon: Layers },
    { to: '/dean/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/dean/drives', label: 'Drives', icon: Briefcase },
    { to: '/dean/assignments', label: 'Assign', icon: Link2 },
  ],
}

export const HELP: Record<Role, string[]> = {
  student: [
    'Home shows your attendance, active applications and drives open to you.',
    'Apply to a drive from Drives. You can apply to each drive once.',
    'Applications shows every interview round your faculty logs, with remarks.',
  ],
  faculty: [
    'Attendance: pick a batch and date, tap Present / Absent / Leave, then Save.',
    '"Mark rest present" fills every unmarked student in one tap.',
    'Interviews: log each round for your students. Offered / rejected closes the application.',
  ],
  dean: [
    'Analytics compares attendance across batches and shows the placement funnel.',
    'Drives: post, edit or remove company drives. Students see them instantly.',
    'Assignments: link faculty to batches. Faculty only see their own batches.',
  ],
  admin: [
    'Users: create accounts, change roles, and set student roll numbers and batches.',
    'Batches: create cohorts like "2026 CSE-A", then add students to them.',
    'You can also use every dean screen: analytics, drives and assignments.',
  ],
}
