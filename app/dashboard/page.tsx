'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { fr } from 'date-fns/locale/fr'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { FileText, Clock, Users, ClipboardList } from 'lucide-react'
import Link from 'next/link'

const AdminDashboard = () => {
  const [email, setEmail] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    setSelectedDate(new Date())
  }, [])
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setEmail(session.user.email ?? null)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }

    getUser()
  }, [])

  return (
    <div className="min-h-screen bg-background p-8 space-y-8">
      {/* En-tête */}
      <header className="space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
            {email && <p className="text-muted-foreground">Connecté en tant que {email}</p>}
          </div>
            <Button variant="outline" onClick={async () => {
            await supabase.auth.signOut()
            window.location.href = '/login'
            }}>
            Déconnexion
            </Button>
        </div>
      </header>

      <Separator className="my-6" />

      <Tabs defaultValue="planning" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="planning">Planning & Tâches</TabsTrigger>
          <TabsTrigger value="rapports">Rapports</TabsTrigger>
          <TabsTrigger value="employes">Employés</TabsTrigger>
        </TabsList>

        {/* Planning et Tâches */}
        <TabsContent value="planning">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Planning du Personnel
                </CardTitle>
              </CardHeader>
                <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date: Date | undefined) => date && setSelectedDate(date)}
                  locale={fr}
                  weekStartsOn={1}
                  formatters={{
                  formatCaption: (date) =>
                    date.toLocaleString('fr', { month: 'long', year: 'numeric' }),
                  formatWeekdayName: (date) =>
                    date.toLocaleString('fr', { weekday: 'short' }).slice(0, 3)
                  }}
                />
                <Separator className="my-4" />
                <div className="space-y-4">
                  <h3 className="font-medium">Personnel {selectedDate?.toLocaleDateString('fr-FR')}</h3>
                  <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Ouverture (9h-15h)</span>
                    <Button variant="outline" size="sm">Assigner</Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Fermeture (15h-23h)</span>
                    <Button variant="outline" size="sm">Assigner</Button>
                  </div>
                  </div>
                </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Configuration des Tâches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Tâches d&apos;ouverture</h3>
                    <Button
                      variant="ghost"
                      asChild
                      className="w-full justify-start"
                    >
                      <Link href="/dashboard/tasks">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Gestion des Tâches
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rapports */}
        <TabsContent value="rapports">
          <Card>
            <CardHeader>
              <CardTitle>Rapports Journaliers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Employé</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>13/02/2025</TableCell>
                    <TableCell>Ouverture</TableCell>
                    <TableCell>Marie D.</TableCell>
                    <TableCell>Complété ✓</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Voir rapport</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>13/02/2025</TableCell>
                    <TableCell>Fermeture</TableCell>
                    <TableCell>Thomas B.</TableCell>
                    <TableCell>Complété ✓</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Voir rapport</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestion des employés */}
        <TabsContent value="employes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gestion des Employés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Marie D.</TableCell>
                    <TableCell>marie@example.com</TableCell>
                    <TableCell>Employé</TableCell>
                    <TableCell>Actif</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Gérer</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminDashboard
