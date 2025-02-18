import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: true
    }

  }
);

interface Employee {
  id: UUID;
  full_name: string;
}

// Définition plus stricte des types
type UUID = string & { _brand: 'UUID' };

interface Task {
    id: UUID;
    title: string;
    description: string;
    assigned_to: UUID | null;
    due_date: string;
    created_at: string;
}

interface TaskFormData {
    title: string;
    description: string;
    assigned_to: UUID | null;
    due_date: string;
}

const initialFormData: TaskFormData = {
  title: '',
  description: '',
  assigned_to: null,
  due_date: '',
};

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('task_templates') // Replace 'your_actual_table_name' with the correct table name
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert('Error: Failed to fetch tasks');
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      alert('Error: Failed to fetch employees');
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, assigned_to: value as UUID }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, due_date: e.target.value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedTask(null);
    setIsDialogOpen(false);
    setIsDeleteDialogOpen(false);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      assigned_to: task.assigned_to,
      due_date: task.due_date,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (task: Task) => {
    setSelectedTask(task);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTask) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', selectedTask.id);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
      alert('Tâche supprimée avec succès');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error: Failed to delete task');
    } finally {
      resetForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation des données avant envoi
    if (!formData.title || !formData.description || !formData.due_date) {
        alert('Veuillez remplir tous les champs');
        return;
    }

    const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assigned_to: formData.assigned_to,
        due_date: formData.due_date
    };

    try {
        if (selectedTask) {
            // Mise à jour
            const { error } = await supabase
                .from('tasks')
                .update(taskData)
                .eq('id', selectedTask.id)
                .select()
                .single();

            if (error) throw error;

            await fetchTasks(); // Recharger la liste complète
            alert('Tâche modifiée avec succès');
        } else {
            // Création
            const { data, error } = await supabase
                .from('tasks')
                .insert([taskData])
                .select()
                .single();

            if (error) throw error;

            await fetchTasks(); // Recharger la liste complète
            alert('Tâche ajoutée avec succès');
        }
    } catch (error: any) {
        console.error('Erreur complète:', error);
        alert(`Erreur: ${error.message || 'Une erreur est survenue'}`);
    } finally {
        resetForm();
    }
};

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Liste des tâches</CardTitle>
          <Button
            className="bg-black hover:bg-gray-100 hover:text-black"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une tâche
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div>
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-gray-500">{task.description}</div>
                  <div className="text-sm text-gray-500">{task.due_date}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white bg-black hover:text-black"
                    onClick={() => handleEdit(task)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white bg-red-700 hover:text-red-600"
                    onClick={() => handleDelete(task)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTask ? 'Modifier une tâche' : 'Ajouter une tâche'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Attribuer à</Label>
                <Select
                  value={formData.assigned_to || ''}
                  onValueChange={(value) => handleSelectChange(value as UUID)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Date limite</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={handleDateChange}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={resetForm}>
                Annuler
              </Button>
              <Button className="bg-black text-white hover:bg-gray-100 hover:text-black">
                {selectedTask ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={resetForm}>
              Annuler
            </Button>
            <Button
              className="bg-red-700 text-white hover:bg-red-600"
              onClick={confirmDelete}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Tasks;
