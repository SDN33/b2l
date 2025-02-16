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
        }
    }
}
