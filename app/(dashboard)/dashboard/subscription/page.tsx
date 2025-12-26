import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SubscriptionManager from '@/components/subscription/SubscriptionManager'

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex items-center justify-center">
      <div className="w-full max-w-2xl px-4 sm:px-6 lg:px-8">
        <SubscriptionManager />
      </div>
    </div>
  )
}


