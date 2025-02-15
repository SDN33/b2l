'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import {
  FileText,
  Calendar,
  ClipboardList,
  Users,
  Settings
} from 'lucide-react'
import NotesComponent  from '../../components/notes/Notes'
import { cn } from '@/lib/utils'

// Composant temporaire pour les sections en développement
const PlaceholderComponent = ({ title }: { title: string }) => (
  <div className="p-4">
    <h2 className="text-2xl font-bold mb-4">{title}</h2>
    <p>Section en cours de développement...</p>
  </div>
)

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('notes')
  const supabase = createClient()

  const menuItems = [
    {
      id: 'notes',
      title: 'Notes',
      icon: FileText,
      component: () => {
        return NotesComponent()
      }
    },
    {
      id: 'planning',
      title: 'Planning',
      icon: Calendar,
      component: () => <PlaceholderComponent title="Planning" />
    },
    {
      id: 'tasks',
      title: 'Gestion des tâches',
      icon: ClipboardList,
      component: () => <PlaceholderComponent title="Gestion des tâches" />
    },
    {
      id: 'employees',
      title: 'Employés',
      icon: Users,
      component: () => <PlaceholderComponent title="Employés" />
    },
    {
      id: 'settings',
      title: 'Paramètres',
      icon: Settings,
      component: () => <PlaceholderComponent title="Paramètres" />
    }
  ]

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setEmail(session.user.email ?? null)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }

    getUser()
  }, [])

  const Sidebar = () => (
    <div className="flex flex-col w-64 bg-background border-r h-screen p-4">
      <div className="space-y-4">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={100}
            height={100}
            className="mb-6 mx-auto"
          />
          <h2 className="mb-2 px-4 text-lg font-semibold">Menu</h2>
          <div className="space-y-2">
            {menuItems.map((item) => (
                <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex items-center w-full rounded-lg px-3 py-2 text-sm font-medium",
                  activeSection === item.id ? "bg-red-700 text-white" : "transparent"
                )}
                >
                <item.icon className="h-4 w-4 mr-2" />
                {item.title}
                </button>
            ))}
          </div>
        </div>
    </div>
  )

  const ActiveComponent = () => {
    const currentMenuItem = menuItems.find(item => item.id === activeSection)
    return currentMenuItem ? currentMenuItem.component() : null
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          <header className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
                {email && <p className="text-muted-foreground">Connecté en tant que {email}</p>}
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  await supabase.auth.signOut()
                  window.location.href = '/auth/login'
                }}
              >
                Déconnexion
              </Button>
            </div>
          </header>
          <Separator className="my-6" />
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}
