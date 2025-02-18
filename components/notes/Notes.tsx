'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Folder, Archive, Settings, Trash2, RotateCcw } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import type { Database } from '@/types/database'

type Note = Database['public']['Tables']['notes']['Row']
type Employee = Database['public']['Tables']['employee']['Row']

const NotesComponent = () => {
  const [currentNote, setCurrentNote] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([])
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showEmployees, setShowEmployees] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const formatDate = (dateString: string) => {
    if (typeof window === 'undefined') return ''
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const supabase = createClient()

  const handleSaveNote = async () => {
    try {
      const { error } = await supabase
        .from('notes')
        .insert([
          { content: currentNote, archived: false }
        ])
      if (error) throw error
      setCurrentNote('')
      fetchNotes()
    } catch (error) {
      console.error('Error saving note:', error)
    }
  }

  const fetchNotes = useCallback(async () => {
    try {
      // Fetch active notes
      const { data: activeData, error: activeError } = await supabase
        .from('notes')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false })

      if (activeError) throw activeError
      if (activeData) setNotes(activeData)

      // Fetch archived notes
      const { data: archivedData, error: archivedError } = await supabase
        .from('notes')
        .select('*')
        .eq('archived', true)
        .order('created_at', { ascending: false })

      if (archivedError) throw archivedError
      if (archivedData) setArchivedNotes(archivedData)
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }, [supabase])

  const handleArchiveNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ archived: true })
        .eq('id', noteId)

      if (error) throw error
      fetchNotes()
    } catch (error) {
      console.error('Error archiving note:', error)
    }
  }

  const handleUnarchiveNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ archived: false })
        .eq('id', noteId)

      if (error) throw error
      fetchNotes()
    } catch (error) {
      console.error('Error unarchiving note:', error)
    }
  }

  const handleDeleteAllArchived = async () => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('archived', true)

      if (error) throw error
      setDeleteSuccess(true)
      setTimeout(() => setDeleteSuccess(false), 3000)
      fetchNotes()
    } catch (error) {
      console.error('Error deleting archived notes:', error)
    }
  }

  const fetchEmployees = useCallback(async () => {
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
    }, [supabase]);

    useEffect(() => {
      fetchEmployees();
    }, [fetchEmployees]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setCurrentNote(value)

    // Vérifier si le dernier caractère est @
    if (value.endsWith('@')) {
      const textarea = textareaRef.current
      if (textarea) {
        const { selectionStart } = textarea
        const textBeforeCursor = value.substring(0, selectionStart)
        const lines = textBeforeCursor.split('\n')
        const currentLineNumber = lines.length - 1
        const lineHeight = 24 // hauteur d'une ligne en pixels
        const charWidth = 8 // largeur moyenne d'un caractère en pixels

        const rect = textarea.getBoundingClientRect()
        const currentLineLength = lines[currentLineNumber].length

        const top = rect.top + (currentLineNumber * lineHeight) - textarea.scrollTop + 30
        const left = rect.left + (currentLineLength * charWidth)

        setCursorPosition({ top, left })
        setShowEmployees(true)
        fetchEmployees()
      }
    } else if (!value.includes('@')) {
      setShowEmployees(false)
    }
  }

  // Ajouter un gestionnaire de clic en dehors pour fermer le popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmployees && textareaRef.current && !textareaRef.current.contains(event.target as Node)) {
        setShowEmployees(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmployees])

  const handleSelectEmployee = (employeeName: string) => {
    const lastAtIndex = currentNote.lastIndexOf('@')
    const newNote = currentNote.substring(0, lastAtIndex) + employeeName + ' '
    setCurrentNote(newNote)
    setShowEmployees(false)
  }

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  return (
    <Tabs defaultValue="notes" className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="archived">Archives</TabsTrigger>
        <TabsTrigger value="settings">Paramètres</TabsTrigger>
      </TabsList>

      {/* Notes actives */}
      <TabsContent value="notes">
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Notes Récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notes.map((note) => (
                  <Card key={note.id} className="p-4">
                    <p className="text-sm text-muted-foreground mb-2" suppressHydrationWarning>
                      {formatDate(note.created_at)}
                    </p>
                    <div className="space-y-2">
                      <p>{note.content}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchiveNote(note.id)}
                        className='bg-black text-white hover:bg-red-800 hover:text-white'
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Archiver
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-1">
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Écrivez votre note ici... (Utilisez @ pour mentionner un employé)"
                    className="min-h-[200px]"
                    value={currentNote}
                    onChange={handleTextareaChange}
                  />
                  {showEmployees && (
                    <div
                      className="absolute z-10 bg-white border rounded-md shadow-lg p-2 max-h-48 overflow-y-auto"
                      style={{
                        position: 'fixed',
                        top: `${cursorPosition.top}px`,
                        left: `${cursorPosition.left}px`,
                        minWidth: '200px',
                        border: '1px solid #ccc',
                        backgroundColor: 'white'
                      }}
                    >
                      {employees.map((employee) => (
                        <div
                          key={employee.id}
                          className="cursor-pointer p-2 hover:bg-gray-100"
                          onClick={() => handleSelectEmployee(employee.name)}
                        >
                          {employee.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleSaveNote}
                  className="w-fit bg-black text-white hover:bg-gray-100 hover:text-black"
                >

                  <Plus className="w-4 h-4 mr-2" />
                  Publier
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Notes archivées */}
      <TabsContent value="archived">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Notes Archivées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Contenu</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedNotes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell suppressHydrationWarning>{new Date(note.created_at).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{note.content}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnarchiveNote(note.id)}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restaurer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Paramètres */}
      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Paramètres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deleteSuccess && (
                <Alert className="mb-4">
                  <AlertDescription>
                    Toutes les notes archivées ont été supprimées avec succès.
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Supprimer toutes les notes archivées</h3>
                  <p className="text-sm text-muted-foreground">
                    Cette action est irréversible. Toutes les notes archivées seront définitivement supprimées.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAllArchived}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

export default NotesComponent
