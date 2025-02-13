// types/database.ts
export interface Employee {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'employee'
  created_at: string
}

export interface TaskTemplate {
  id: string
  name: string
  category: 'opening' | 'closing'
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Shift {
  id: string
  date: string
  shift_type: 'opening' | 'closing'
  employee_id: string | null
  status: 'planned' | 'in_progress' | 'completed'
  created_at: string
}

export interface AssignedTask {
  id: string
  shift_id: string
  template_id: string
  completed: boolean
  completed_at: string | null
  notes: string | null
}

export interface CashReport {
  id: string
  shift_id: string
  amount_start: number | null
  amount_end: number | null
  notes: string | null
  created_at: string
}
