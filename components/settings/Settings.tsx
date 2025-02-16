import React, { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Button } from '../ui/button';  // Import du composant Button de Shadcn UI
import * as Dialog from '@radix-ui/react-dialog';  // Import du composant Dialog de Radix UI pour la confirmation

const supabase = createClient();

const Settings: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [warningVisible, setWarningVisible] = useState(false);

  // Fonction pour modifier le display name dans l'auth Supabase
  const handleChangeDisplayName = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.auth.updateUser({ data: { display_name: displayName } });
      if (error) {
        alert('Erreur lors de la mise à jour du display name.');
      } else {
        alert('Display name mis à jour avec succès!');
      }
    } else {
      alert('Utilisateur non connecté.');
    }
  };

  // Fonction pour vider les données des utilisateurs sans supprimer les tables
  const handleClearUserData = async () => {
    // Affiche un avertissement avant de procéder
    if (!window.confirm('Êtes-vous sûr de vouloir vider les données des utilisateurs sans supprimer les tables ? Cela supprimera toutes les données utilisateur, y compris les notes, les préférences, etc.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .neq('id', ''); // Cette commande vide la table 'users' en supprimant les données utilisateur, sans supprimer les tables.

      if (error) {
        throw new Error(error.message);
      }
      alert('Les données des utilisateurs ont été supprimées.');
    } catch (error) {
      alert('Erreur lors de la suppression des données utilisateur: ' + (error instanceof Error ? error.message : 'Une erreur est survenue'));
    }
  };

  return (
    <div className="settings-container">
      <h2>Paramètres</h2>

      {/* Modification du display name */}
      <div className="change-display-name">
        <h3>Modifier votre nom d&apos;utilisateur</h3>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Nouveau display name"
        />
        <Button onClick={handleChangeDisplayName}>Mettre à jour</Button> {/* Utilisation du bouton Shadcn UI */}
      </div>

      {/* Vider les données des utilisateurs */}
      <div className="clear-user-data">
        <h3>Vider les données des utilisateurs</h3>
        <p>Attention, cette action supprimera toutes les données (notes, employés, etc.).</p>

        {/* Bouton pour ouvrir le dialogue de confirmation */}
        <Dialog.Root open={warningVisible} onOpenChange={setWarningVisible}>
          <Dialog.Trigger asChild>
            <Button>Vider les données</Button>
          </Dialog.Trigger>

          {/* Dialog de confirmation avant suppression */}
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/3 p-6 bg-white rounded-md shadow-lg">
              <Dialog.Title>Confirmer la suppression</Dialog.Title>
              <Dialog.Description>
                Êtes-vous sûr de vouloir vider toutes les données utilisateur ? Cette action est irréversible.
              </Dialog.Description>
              <div className="flex space-x-4 mt-4">
                <Button
                  className="bg-red-500 hover:bg-red-700"
                  onClick={handleClearUserData}>
                  Confirmer
                </Button>
                <Button className="bg-gray-500 hover:bg-gray-700" onClick={() => setWarningVisible(false)}>
                  Annuler
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
};

export default Settings;
