import 'next-auth'

export type UserRole = 'ORGANIZER' | 'PARTICIPANT' | 'ADMIN'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      hasBurEntry: boolean
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    hasBurEntry: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    hasBurEntry: boolean
  }
}

