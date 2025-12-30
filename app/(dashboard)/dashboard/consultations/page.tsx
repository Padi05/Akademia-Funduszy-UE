import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ConsultationManager from '@/components/consultations/ConsultationManager'

export default async function ConsultationsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ConsultationManager />
    </div>
  )
}

