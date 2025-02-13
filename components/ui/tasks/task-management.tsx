'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import type { TaskTemplate } from '@/types/database'

const useToast = () => ({
  toast: ({ title, description, variant }: {
    title: string,
    description: string,
    variant?: string
  }) => {
    window.alert(`${title}\n${description}`)
  }
})

export const TaskManagement = () => {
  const [tasks, setTasks] = useState<TaskTemplate[]>([])
  const [editingTask, setEditingTask] = useState<TaskTemplate | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const data = await api.getTaskTemplates()
      setTasks(data)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les tâches',
        variant: 'destructive',
      })
    }
  }

  const handleSaveTask = async (task: Partial<TaskTemplate>) => {
    try {
      if (editingTask) {
        await api.updateTaskTemplate(editingTask.id, task)
        toast({
          title: 'Succès',
          description: 'Tâche mise à jour',
        })
      } else {
        // Handle create
      }
      loadTasks()
      setEditingTask(null)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la tâche',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gestion des Tâches</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Nouvelle Tâche</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle Tâche</DialogTitle>
              </DialogHeader>
              <TaskForm onSubmit={handleSaveTask} />
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <h3 className="font-medium">Tâches d&apos;ouverture</h3>
          <TaskList
            tasks={tasks.filter(t => t.category === 'opening')}
            onEdit={setEditingTask}
          />

          <h3 className="font-medium">Tâches de fermeture</h3>
          <TaskList
            tasks={tasks.filter(t => t.category === 'closing')}
            onEdit={setEditingTask}
          />
        </div>

        {editingTask && (
          <Dialog open={true} onOpenChange={() => setEditingTask(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier la Tâche</DialogTitle>
              </DialogHeader>
              <TaskForm
                task={editingTask}
                onSubmit={handleSaveTask}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}

const TaskList = ({
  tasks,
  onEdit
}: {
  tasks: TaskTemplate[],
  onEdit: (task: TaskTemplate) => void
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map(task => (
          <TableRow key={task.id}>
            <TableCell>{task.name}</TableCell>
            <TableCell>{task.description}</TableCell>
            <TableCell>{task.is_active ? 'Actif' : 'Inactif'}</TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(task)}
              >
                Modifier
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

const TaskForm = ({
  task,
  onSubmit
}: {
  task?: TaskTemplate
  onSubmit: (data: Partial<TaskTemplate>) => void
}) => {
  const [formData, setFormData] = useState({
    name: task?.name ?? '',
    description: task?.description ?? '',
    category: task?.category ?? 'opening',
    is_active: task?.is_active ?? true
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(formData)
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <label>Nom</label>
        <Input
          value={formData.name}
          onChange={e => setFormData(d => ({ ...d, name: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <label>Description</label>
        <Textarea
          value={formData.description}
          onChange={e => setFormData(d => ({ ...d, description: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <label>Catégorie</label>
        <select
          className="w-full"
          value={formData.category}
          onChange={e => setFormData(d => ({ ...d, category: e.target.value as 'opening' | 'closing' }))}
        >
          <option value="opening">Ouverture</option>
          <option value="closing">Fermeture</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={checked => setFormData(d => ({ ...d, is_active: checked }))}
        />
        <label>Actif</label>
      </div>

      <Button type="submit" className="w-full">
        {task ? 'Mettre à jour' : 'Créer'}
      </Button>
    </form>
  )
}
