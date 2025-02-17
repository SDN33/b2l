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

// Définition plus stricte des types
type UUID = string & { _brand: 'UUID' };

interface Employee {
    id: UUID;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
}

interface EmployeeFormData {
    email: string;
    full_name: string;
    role: string;
}

const initialFormData: EmployeeFormData = {
  email: '',
  full_name: '',
  role: '',
};
const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      console.error('Failed to fetch employees');
      alert('Error: Failed to fetch employees');
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedEmployee(null);
    setIsDialogOpen(false);
    setIsDeleteDialogOpen(false);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      email: employee.email,
      full_name: employee.full_name,
      role: employee.role,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedEmployee) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', selectedEmployee.id);

      if (error) throw error;

      setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployee.id));
      alert('Employé supprimé avec succès');
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Error: Failed to delete employee');
    } finally {
      resetForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation des données avant envoi
    if (!formData.email || !formData.full_name || !formData.role) {
        alert('Veuillez remplir tous les champs');
        return;
    }

    const employeeData = {
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        role: formData.role
    };

    try {
        if (selectedEmployee) {
            // Mise à jour
            const { error } = await supabase
                .from('employees')
                .update(employeeData)
                .eq('id', selectedEmployee.id)
                .select()
                .single();

            if (error) throw error;

            await fetchEmployees(); // Recharger la liste complète
            alert('Employé modifié avec succès');
        } else {
            // Création
            console.log('Données à insérer:', employeeData);

            const { data, error } = await supabase
                .from('employees')
                .insert([employeeData])
                .select()
                .single();

            if (error) {
                console.error('Erreur Supabase:', error);
                throw error;
            }

            if (!data) {
                throw new Error('Aucune donnée retournée après insertion');
            }

            await fetchEmployees(); // Recharger la liste complète
            alert('Employé ajouté avec succès');
        }
    } catch (error: any) {
        console.error('Erreur complète:', error);
        alert(`Erreur: ${error.message || 'Une erreur est survenue'}`);
    } finally {
        resetForm();
    }
};

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getRandomColor = (str: string) => {
    const colors = [
      'bg-purple-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-cyan-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-violet-500',
      'bg-rose-500',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-lime-500'
    ];

    // Create a deterministic hash from the string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Use absolute value of hash to get a positive index
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Liste des employés</CardTitle>
          <Button
            className="bg-black hover:bg-gray-100 hover:text-black"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un employé
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getRandomColor(
                      employee.full_name
                    )}`}
                  >
                    {getInitials(employee.full_name)}
                  </div>
                  <div>
                    <div className="font-medium">{employee.full_name}</div>
                    <div className="text-sm text-gray-500">{employee.email}</div>
                    <div className="text-sm text-gray-500">
                      {employee.role === 'employee' ? 'Employé' : employee.role === 'interim' ? 'Interim' : employee.role}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white bg-black hover:text-black"
                    onClick={() => handleEdit(employee)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white bg-red-700 hover:text-red-600"
                    onClick={() => handleDelete(employee)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEmployee ? 'Modifier un employé' : 'Ajouter un employé'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employé</SelectItem>
                    <SelectItem value="interim">Interim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                Annuler
              </Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800">
                {selectedEmployee ? 'Modifier' : 'Ajouter'}
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
          <p>
            Êtes-vous sûr de vouloir supprimer {selectedEmployee?.full_name} ?
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
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

export default Employees;
