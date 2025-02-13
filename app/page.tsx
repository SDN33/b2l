'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/auth/login')
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error checking session:', error)
        router.push('/auth/login')
      }
    }
    
    checkSession()
  }, [router])

  return null
}