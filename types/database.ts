export type Database = {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string
          content: string
          created_at: string
          archived: boolean
        }
      }
      employee: {
        Row: {
          id: string
          name: string
          created_at: string
        }
      }
      employees: {
        Row: {
          id: string
          full_name: string
          email: string
          created_at: string
        }
      }
      task_templates: {
        Row: {
          id: string
          name: string
          category: string
          updated_at: string
          created_at: string
        }
      }
      shifts: {
        Row: {
          id: string
          date: string
          employee_id: string
          created_at: string
        }
      }
      assigned_tasks: {
        Row: {
          id: string
          shift_id: string
          template_id: string
          created_at: string
        }
      }
      cash_reports: {
        Row: {
          id: string
          shift_id: string
          created_at: string
        }
      }
    }
  }
}

export type Employee = Database['public']['Tables']['employees']['Row']
export type TaskTemplate = Database['public']['Tables']['task_templates']['Row']
export type Shift = Database['public']['Tables']['shifts']['Row']
export type AssignedTask = Database['public']['Tables']['assigned_tasks']['Row']
export type CashReport = Database['public']['Tables']['cash_reports']['Row']
