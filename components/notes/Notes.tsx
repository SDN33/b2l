'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Plus, Folder, Archive, Settings, Trash2, RotateCcw } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

const NotesComponent = () => {
  const [currentNote, setCurrentNote] = useState('')
  const [notes, setNotes] = useState<Array<{ id: string, content: string, created_at: string }>>([])
  const [archivedNotes, setArchivedNotes] = useState<Array<{ id: string, content: string, created_at: string }>>([])
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

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
                        className='bg-black text-white'
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
                <Textarea
                  placeholder="Écrivez votre note ici..."
                  className="min-h-[200px]"
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                />
                <Button onClick={handleSaveNote} className="w-fit">
                  <Plus className="w-4 h-4 mr-2" />
                  Sauvegarder
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
