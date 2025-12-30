export type UserRole = 'ORGANIZER' | 'PARTICIPANT' | 'ADMIN'
export type CourseType = 'STACJONARNY' | 'ONLINE'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
  hasBurEntry: boolean
}

