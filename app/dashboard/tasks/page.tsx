// app/dashboard/tasks/page.tsx
'use client'

import { TaskManagement } from '../../../components/ui/tasks/task-management'
import { Separator } from '@/components/ui/separator'

export default function TasksPage() {
  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gestion des Tâches</h2>
        <p className="text-muted-foreground">
          Configurez les tâches d&apos;ouverture et de fermeture du bar.
        </p>
      </div>

      <Separator />

      <TaskManagement />
    </div>
  )
}
