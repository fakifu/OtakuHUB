import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Globe, User, LogOut, FolderInput, CheckCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import AuthForm from '../components/auth/AuthForm';
import ConfirmModal from '../components/ui/Feedback/ConfirmModal';
import ListCard from '../components/ui/Layout/ListCard';

export default function SettingsPage() {
  const { t, language, changeLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { library, pushLocalLibraryToSupabase } = useLibrary();
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

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-32 max-w-lg mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
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
