// lib/api.ts
import { createClient } from '@/lib/supabase/client'
import type { Employee, TaskTemplate, Shift, AssignedTask, CashReport } from '@/types/database'

const supabaseClient = createClient()

export const supabase = {
  // Employees
  async getEmployees() {
    const { data, error } = await supabaseClient
      .from('employees')
      .select('*')
      .order('full_name')

    if (error) throw error
    return data as Employee[]
  },

  async createEmployee(employee: Omit<Employee, 'id' | 'created_at'>) {
    const { data, error } = await supabaseClient
      .from('employees')
      .insert(employee)
      .select()
      .single()

    if (error) throw error
    return data as Employee
  },

  // Task Templates
  async getTaskTemplates() {
    const { data, error } = await supabaseClient
      .from('task_templates')
      .select('*')
      .order('category, name')

    if (error) throw error
    return data as TaskTemplate[]
  },

  async updateTaskTemplate(id: string, template: Partial<TaskTemplate>) {
    const { data, error } = await supabaseClient
      .from('task_templates')
      .update({ ...template, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as TaskTemplate
  },

  // Shifts
  async getShifts(startDate: Date, endDate: Date) {
    const { data, error } = await supabaseClient
      .from('shifts')
      .select(`
        *,
        employee:employees(full_name, email)
      `)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date')

    if (error) throw error
    return data
  },

  async createShift(shift: Omit<Shift, 'id' | 'created_at'>) {
    const { data, error } = await supabaseClient
      .from('shifts')
      .insert(shift)
      .select()
      .single()

    if (error) throw error
    return data as Shift
  },

  // Reports
  async getShiftReport(shiftId: string) {
    const { data, error } = await supabaseClient
      .from('shifts')
      .select(`
      *,
      employee:employees(full_name, email),
      tasks:assigned_tasks(
        *,
        template:task_templates(*)
      ),
      cash_report:cash_reports(*)
      `)
      .eq('id', shiftId)
      .single()

    if (error) throw error
    return data
  }
}

export default supabase
