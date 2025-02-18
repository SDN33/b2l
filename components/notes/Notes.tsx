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


   const fetchEmployees = useCallback(async (searchTerm: string = '') => {
    try {
      let query = supabase.from('employees').select('*').order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('full_name', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      console.error('Failed to fetch employees');
      alert('Error: Failed to fetch employees');
    }
  }, [supabase]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCurrentNote(value);
    const lastAtIndex = value.lastIndexOf('@');


    if (value.includes('@')) {
      const searchTerm = value.substring(lastAtIndex + 1);
      setShowEmployees(true);
      fetchEmployees(searchTerm);
    } else {
      setShowEmployees(false);
    }

    calculateCursorPosition();

  };

  const calculateCursorPosition = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const { selectionStart } = textarea;
      const textBeforeCursor = textarea.value.substring(0, selectionStart);
      const lines = textBeforeCursor.split('\n');
      const currentLineNumber = lines.length - 1;
      const lineHeight = 24; // Adjust based on your CSS
      const charWidth = 8;   // Adjust based on your CSS

      const rect = textarea.getBoundingClientRect();
      const currentLineLength = lines[currentLineNumber].length;

      const top = rect.top + (currentLineNumber * lineHeight) - textarea.scrollTop + 30;
      const left = rect.left + (currentLineLength * charWidth);

      setCursorPosition({ top, left });
    }
  };

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

  const handleSelectEmployee = (employeeFullName: string) => {
    console.log("handleSelectEmployee appelé avec:", employeeFullName);
    console.log("currentNote avant modification:", currentNote);

    const lastAtIndex = currentNote.lastIndexOf('@');
    const newNote = currentNote.substring(0, lastAtIndex) + `**${employeeFullName}** `;

    setCurrentNote(prevNote => { // Utilisation d'une fonction de mise à jour
      console.log("prevNote:", prevNote); // Log de l'état précédent
      console.log("newNote dans setState:", newNote); // Log de la nouvelle note juste avant setState
      return newNote; // Retourne la nouvelle valeur pour mettre à jour l'état
    });

    console.log("newNote après modification:", newNote);
    console.log("currentNote après setState:", currentNote);


    setShowEmployees(false);

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
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
                        className='bg-black text-white text-xs hover:bg-red-800 hover:text-white'
                        >
                        <Archive className="w-2 h-2 mr-2 text-xs" />
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
                    placeholder="Écrivez votre note ici... (Utilisez @ pour voir les noms de vos employés)"
                    className="min-h-[200px]"
                    value={currentNote}
                    onChange={(e) => handleTextareaChange(e as React.ChangeEvent<HTMLTextAreaElement>)}
                    style={{ fontWeight: 'semibold', color: 'black' }} // Style par défaut du textarea en noir et gras
                  />
                    {showEmployees && (
                    <div
                      className="absolute z-10 bg-white text-black border rounded-md shadow-lg p-2 max-h-48 overflow-y-auto"
                      style={{
                      position: 'fixed',
                      top: `${cursorPosition.top}px`,
                      left: `${cursorPosition.left}px`,
                      minWidth: '200px',
                      border: '1px solid #ccc',
                      backgroundColor: 'white'
                      }}
                    >
                      {employees.length > 0 ? employees.map((employee) => (
                        <div
                          key={employee.id} // <-- Assure-toi d'avoir une key unique, ici 'employee.id'
                          className="cursor-pointer p-2 hover:bg-gray-100 text-black"
                          onClick={() => handleSelectEmployee(employee.full_name)}
                        >
                          {employee.full_name}
                        </div>
                      )) : (
                        <div className="p-2 text-gray-500">Aucun employé trouvé</div>
                      )}
                    </div>
                    )
                  }
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
