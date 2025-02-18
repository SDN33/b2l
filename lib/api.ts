// lib/api.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@/lib/supabase/client'
import type { Employee, TaskTemplate, Shift, AssignedTask, ShiftWithDetails } from '@/types/database'

const supabaseClient = createClient()
const supabaseAuth = createClientComponentClient()

export type CreateShiftParams = {
  date: string;
  employee_id: string | null;
  shift_type: 'opening' | 'closing';
  status: 'planned' | 'in_progress' | 'completed';
};

export type CreateTaskParams = {
  template_id: string;
  shift_id: string;
  employee_id: string | null;
  notes: string | null;
  completed: boolean;
  completed_at: string | null;
};

export type UpdateTaskParams = Partial<{
  id: string;
  template_id: string;
  shift_id: string;
  notes: string | null;
  completed: boolean;
  completed_at: string | null;
  employee_id: string | null;
}>;

export const api = {
  async createShift(params: CreateShiftParams) {
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) throw new Error('User must be authenticated')

    const { data, error } = await supabaseAuth
      .from('shifts')
      .insert({
        ...params,
      })
      .select()
      .single()

    if (error) throw new Error(error.message || 'Error creating shift')
    return data as Shift
  },

  async getShifts(startDate: Date, endDate: Date) {
    const { data, error } = await supabaseAuth
      .from('shifts')
      .select(`
        *,
        employee:employees(*)
      `)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date')

    if (error) throw new Error(error.message || 'Error fetching shifts')
    return data as Shift[]
  },

  async getShiftReport(shiftId: string) {
    const { data, error } = await supabaseAuth
      .from('shifts')
      .select(`
        *,
        employee:employees(*),
        tasks:assigned_tasks(
          *,
          template:task_templates(*),
          employee:employees(*)
        )
      `)
      .eq('id', shiftId)
      .single()

    if (error) throw new Error(error.message || 'Error fetching shift report')
    return data as ShiftWithDetails
  },

  // Employees
  async getEmployees() {
    const { data, error } = await supabaseClient
      .from('employees')
      .select('*')
      .order('full_name')

    if (error) throw new Error(error.message || 'Error fetching employees')
    return data as Employee[]
  },

  // Task Templates
  async getTaskTemplates() {
    const { data, error } = await supabaseClient
      .from('task_templates')
      .select('*')
      .order('category, name')

    if (error) throw new Error(error.message || 'Error fetching task templates')
    return data as TaskTemplate[]
  },

  async createTaskTemplate(template: {
    name: string;
    category: string;
    description: string;
    is_active: boolean;
    updated_at: string;
  }) {
    const { data, error } = await supabaseClient
      .from('task_templates')
      .insert(template)
      .select()
      .single()

    if (error) throw new Error(error.message || 'Error creating task template')
    return data as TaskTemplate
  },

  async updateTaskTemplate(id: string, template: Partial<TaskTemplate>) {
    const { data, error } = await supabaseClient
      .from('task_templates')
      .update({ ...template, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message || 'Error updating task template')
    return data as TaskTemplate
  },

  // Tasks
  async createTask(task: CreateTaskParams) {
    const { data, error } = await supabaseClient
      .from('assigned_tasks')
      .insert({
        ...task,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        template:task_templates(*),
        employee:employees(*)
      `)
      .single()

    if (error) throw new Error(error.message || 'Error creating task')
    return data as AssignedTask & {
      template: TaskTemplate;
      employee: Employee | null;
    }
  },

  async updateTask(taskId: string, updates: UpdateTaskParams) {
    const { data, error } = await supabaseClient
      .from('assigned_tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select(`
        *,
        template:task_templates(*),
        employee:employees(*)
      `)
      .single()

    if (error) throw new Error(error.message || 'Error updating task')
    return data as AssignedTask & {
      template: TaskTemplate;
      employee: Employee | null;
    }
  },

  async deleteTask(taskId: string) {
    const { error } = await supabaseClient
      .from('assigned_tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw new Error(error.message || 'Error deleting task')
  }
}

export default api
