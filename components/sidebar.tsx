'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  FileText,
  Calendar,
  ClipboardList,
  Users,
  Settings
} from 'lucide-react'

const menuItems = [
  {
    title: 'Notes',
    icon: FileText,
    href: '/notes',
  },
  {
    title: 'Planning',
    icon: Calendar,
    href: '/planning',
  },
  {
    title: 'Gestion des tâches',
    icon: ClipboardList,
    href: '/tasks',
  },
  {
    title: 'Employés',
    icon: Users,
    href: '/employees',
  },
  {
    title: 'Paramètres',
    icon: Settings,
    href: '/settings',
  },
]

export const Sidebar = () => {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-background border-r h-screen p-4">
      <div className="space-y-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Menu</h2>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
                )}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
