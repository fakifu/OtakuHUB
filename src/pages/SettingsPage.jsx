import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Globe, User, LogOut, FolderInput, CheckCircle, RefreshCw, Trash2, CloudDownload } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';
import AuthForm from '../components/auth/AuthForm';
import ConfirmModal from '../components/ui/Feedback/ConfirmModal';
import ListCard from '../components/ui/Layout/ListCard';
import importedBackup from '../data/imported_backup.json';

export default function SettingsPage() {
  const { t, language, changeLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { library, pushLocalLibraryToSupabase, importBackupData } = useLibrary();
  const toast = useToast();
  
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const handleAccountClick = () => {
    if (user) {
      setIsSignOutConfirmOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleConfirmSignOut = async () => {
    await signOut();
  };

  const handleManualSync = async () => {
    if (!user) {
      toast?.showToast('info', 'Connectez-vous à votre compte Supabase pour synchroniser vos animés.');
      setIsAuthOpen(true);
      return;
    }

    try {
      await pushLocalLibraryToSupabase();
      toast?.showToast('success', `${library.length} animés synchronisés avec succès sur le Cloud Supabase !`);
    } catch (err) {
      toast?.showToast('error', 'Erreur lors de la synchronisation avec Supabase.');
    }
  };

  const handleImport62Animes = async () => {
    try {
      await importBackupData(importedBackup);
      toast?.showToast('success', `📦 ${importedBackup.length} animés importés dans la bibliothèque locale !`);
      if (user) {
        await pushLocalLibraryToSupabase();
        toast?.showToast('success', `☁️ Synchronisation réussie avec Supabase NexusOS !`);
      } else {
        toast?.showToast('info', `Connectez-vous ci-dessous pour pousser vos animés sur NexusOS.`);
        setIsAuthOpen(true);
      }
    } catch (err) {
      toast?.showToast('error', `Erreur lors de l'import: ${err.message}`);
    }
  };

  const handlePullFromSupabase = async () => {
    if (!user) {
      toast?.showToast('info', 'Connectez-vous d\'abord pour récupérer votre bibliothèque Cloud.');
      setIsAuthOpen(true);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('otakuhub_library')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      if (data && data.length > 0) {
        await importBackupData(data);
        toast?.showToast('success', `☁️ ${data.length} animés chargés depuis Supabase NexusOS !`);
      } else {
        toast?.showToast('info', 'Aucun animé trouvé pour votre compte dans la base.');
      }
    } catch (err) {
      toast?.showToast('error', `Erreur: ${err.message}`);
    }
  };

  const handleClearLocalStorage = async () => {
    if (window.confirm("Voulez-vous vider tout le cache et le stockage local de cette application ?")) {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        } catch (e) {}
      }
      window.location.reload();
    }
  };

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-32 max-w-lg mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {/* RECHARGER DEPUIS SUPABASE CLOUD */}
        <motion.div variants={itemVariants}>
          <ListCard
            variant="full"
            title="Charger depuis Supabase (Cloud -> Local)"
            subtitle={user ? `Récupérer les 62 animés depuis votre base NexusOS` : 'Connectez-vous pour récupérer votre bibliothèque en ligne'}
            leftIcon={CloudDownload}
            onClick={handlePullFromSupabase}
            className="p-4 border-2 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all cursor-pointer"
          />
        </motion.div>

        {/* IMPORT BACKUP 62 ANIMES */}
        <motion.div variants={itemVariants}>
          <ListCard
            variant="full"
            title="Importer mes 62 animés (Backup local)"
            subtitle={`${importedBackup.length} animés prêts à être envoyés sur votre Supabase NexusOS`}
            leftIcon={FolderInput}
            onClick={handleImport62Animes}
            className="p-4 border-2 border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all cursor-pointer"
          />
        </motion.div>

        {/* THÈME */}
        <motion.div variants={itemVariants}>
          <ListCard
            variant="full"
            title="Thème"
            subtitle={theme === 'dark' ? 'Mode Sombre' : 'Mode Clair'}
            leftIcon={theme === 'dark' ? Moon : Sun}
            onClick={toggleTheme}
            className="p-4"
          />
        </motion.div>

        {/* LANGUE */}
        <motion.div variants={itemVariants}>
          <ListCard
            variant="full"
            title="Langue"
            subtitle={language === 'fr' ? 'Français' : 'English'}
            leftIcon={Globe}
            onClick={() => changeLanguage(language === 'fr' ? 'en' : 'fr')}
            className="p-4"
          />
        </motion.div>

        {/* SYNCHRONISATION CLOUD */}
        <motion.div variants={itemVariants}>
          <ListCard
            variant="full"
            title="Synchroniser avec Supabase"
            subtitle={user ? `Forcer l'envoi de mes ${library.length} animés vers la base` : 'Connexion requise pour envoyer vos animés'}
            leftIcon={RefreshCw}
            onClick={handleManualSync}
            className="p-4"
          />
        </motion.div>

        {/* COMPTE */}
        <motion.div variants={itemVariants}>
          <ListCard
            variant="full"
            title={user ? 'Se déconnecter' : 'Connexion Cloud'}
            subtitle={user ? user.email : 'Sauvegarde et synchronisation'}
            leftIcon={user ? LogOut : User}
            onClick={handleAccountClick}
            className="p-4"
          />
        </motion.div>

        {/* VIDER LE CACHE & STOCKAGE LOCAL */}
        <motion.div variants={itemVariants}>
          <ListCard
            variant="full"
            title="Vider le cache et stockage local"
            subtitle="Réinitialise le stockage de l'app et recharge la page"
            leftIcon={Trash2}
            onClick={handleClearLocalStorage}
            className="p-4 border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 transition-all cursor-pointer"
          />
        </motion.div>
      </motion.div>

      {/* Modale d'authentification */}
      <AuthForm isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Modale de confirmation de déconnexion système */}
      <ConfirmModal
        isOpen={isSignOutConfirmOpen}
        onClose={() => setIsSignOutConfirmOpen(false)}
        onConfirm={handleConfirmSignOut}
        title={t('confirm_signout.title')}
        message={t('confirm_signout.message')}
        isDanger={true}
      />
    </div>
  );
}
