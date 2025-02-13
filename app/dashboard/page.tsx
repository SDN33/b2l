'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const supabase = createClient()
  
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setEmail(session.user.email)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }
    
    getUser()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold">Tableau de bord</h1>
      {email && <p className="mt-2 text-gray-600">Bienvenue, {email}</p>}
      }
    </div>
  )
}