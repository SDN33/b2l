import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle, Circle } from 'lucide-react';

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

  const renderTaskList = (tasks: TaskTemplateWithDetails[], shiftType: string) => (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="capitalize">{shiftType} Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map(template => {
            const isAssigned = assignedTasks.some(
              task => task.template_id === template.id
            );

            return (
              <div key={template.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-gray-500">{template.description}</p>
                  <p className="text-sm text-gray-600">Category: {template.category}</p>
                </div>
                {!isAssigned ? (
                  <Select
                    onValueChange={(employeeId) => handleAssignTask(template.id, employeeId)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      Assigned to: {
                        assignedTasks.find(task => task.template_id === template.id)?.employee?.full_name
                      }
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const task = assignedTasks.find(t => t.template_id === template.id);
                        if (task) handleCompleteTask(task.id);
                      }}
                    >
                      {assignedTasks.find(task => task.template_id === template.id)?.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Daily Tasks</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] pl-3 text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, 'PPP')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading tasks...</div>
      ) : (
        <>
          {Object.entries(groupedTemplates).map(([shiftType, tasks]) =>
            renderTaskList(tasks, shiftType)
          )}
        </>
      )}
    </div>
  );
};

export default DailyTaskManagement;
