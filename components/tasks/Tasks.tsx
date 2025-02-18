import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle, Circle } from 'lucide-react';
import { Sun, Moon, Workflow, Loader2 } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  full_name: string;
}

interface TaskTemplateWithDetails {
  id: string;
  name: string;
  description: string;
  category: string;
  shift_type: string;
  is_active: boolean;
}

interface AssignedTaskWithDetails {
  id: string;
  template_id: string;
  employee_id: string;
  date: string;
  completed: boolean;
  completed_at?: string;
  template: TaskTemplateWithDetails;
  employee: Employee;
}

import { SupabaseClient } from '@supabase/supabase-js';

interface DailyTaskManagementProps {
  employees: Employee[];
  supabase: SupabaseClient;
}

const DailyTaskManagement = ({ employees, supabase }: DailyTaskManagementProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplateWithDetails[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<AssignedTaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch task templates and assigned tasks for the selected date
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        // Fetch task templates
        const { data: templates, error: templatesError } = await supabase
          .from('task_templates')
          .select('*')
          .eq('is_active', true);

        if (templatesError) throw templatesError;

        // Fetch assigned tasks for the selected date
        const { data: assigned, error: assignedError } = await supabase
        .from('assigned_tasks')
        .select(`
          *,
          template:task_templates(*),
          employee:employees(*),
          shift:shifts!inner(date)
        `)
        .eq('shift.date', format(selectedDate, 'yyyy-MM-dd'));

        setTaskTemplates(templates || []);
        setAssignedTasks(assigned || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
      setLoading(false);
    };

    fetchTasks();
  }, [selectedDate, supabase]);

  // Group templates by shift type
  const groupedTemplates = taskTemplates.reduce((acc, template) => {
    if (!acc[template.shift_type]) {
      acc[template.shift_type] = [];
    }
    acc[template.shift_type].push(template);
    return acc;
  }, {} as Record<string, TaskTemplateWithDetails[]>);

  // Assign task to employee
  const handleAssignTask = async (templateId: string, employeeId: string) => {
    try {
      // First get or create the shift for the selected date
      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .select('id')
        .eq('date', format(selectedDate, 'yyyy-MM-dd'))
        .single();

      if (shiftError) throw shiftError;

      // Then create the assigned task with the shift_id
      const { data, error } = await supabase
        .from('assigned_tasks')
        .insert({
          template_id: templateId,
          employee_id: employeeId,
          shift_id: shift.id,
          completed: false
        })
        .select(`
          *,
          template:task_templates(*),
          employee:employees(*)
        `)
        .single();

      if (error) throw error;

      setAssignedTasks([...assignedTasks, data]);
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  // Mark task as completed
  const handleCompleteTask = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('assigned_tasks')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      setAssignedTasks(assignedTasks.map(task =>
        task.id === taskId ? { ...task, ...data } : task
      ));
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const renderTaskList = (tasks: TaskTemplateWithDetails[], category: string) => (
    <Card className="mt-4">
      <CardHeader className="py-3">
        <CardTitle className="text-lg font-semibold capitalize flex items-center gap-2">
          {category === 'opening' && <Sun className="h-4 w-4" />}
          {category === 'closing' && <Moon className="h-4 w-4" />}
          {category === 'custom' && <Workflow className="h-4 w-4" />}
          {category === 'opening' ? 'Ouverture' : category === 'closing' ? 'Fermeture' : 'Tâches personnalisées'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tasks.map(template => {
            const assignedTask = assignedTasks.find(
              task => task.template_id === template.id
            );

            return (
              <div
                key={template.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  assignedTask?.completed ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200",
                  "hover:shadow-sm transition-shadow"
                )}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-500 truncate">{template.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {assignedTask ? (
                    <>
                      <span className="text-sm text-gray-600 truncate max-w-[100px]">
                        {assignedTask.employee?.full_name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCompleteTask(assignedTask.id)}
                        className={cn(
                          "hover:bg-transparent p-1",
                          assignedTask.completed && "text-green-500"
                        )}
                      >
                        {assignedTask.completed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  ) : (
                    <Select
                      onValueChange={(employeeId) => handleAssignTask(template.id, employeeId)}
                    >
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue placeholder="Assigner" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tâches à effectuer</h1>
          <p className="text-sm text-gray-500">
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] pl-3 text-left">
              <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'PPP', { locale: fr })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              locale={fr}
            />
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Chargement des tâches...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {['opening', 'closing', 'custom'].map(category => {
            const categoryTasks = taskTemplates.filter(t => t.category === category);
            if (categoryTasks.length === 0) return null;
            return <React.Fragment key={category}>
              {renderTaskList(categoryTasks, category)}
            </React.Fragment>;
          })}
        </div>
      )}
    </div>
  );
};

export default DailyTaskManagement;
