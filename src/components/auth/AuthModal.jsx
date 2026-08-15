import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, LogOut, CheckCircle, AlertCircle, X, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useTranslation } from '../../hooks/useTranslation';

export default function AuthModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Vérifier la session actuelle au montage
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        setSuccessMsg('Connexion réussie ! Vos données sont synchronisées.');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        setSuccessMsg('Compte créé avec succès ! Vous êtes connecté.');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Une erreur est survenue lors de l\'authentification.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSuccessMsg('Déconnecté avec succès.');
    setLoading(false);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md glass-liquid rounded-card p-6 shadow-2xl border border-white/15 text-foreground space-y-5">
        
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>

        {/* En-tête */}
        <div className="space-y-1 text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-accent/40 text-accent flex items-center justify-center mx-auto mb-2 shadow-lg shadow-accent/20">
            <User size={24} />
          </div>
          <h2 className="text-lg font-black tracking-tight text-foreground">
            {user ? 'Mon Compte OtakuHUB' : (isLogin ? 'Connexion Synchro Cloud' : 'Créer un Compte Cloud')}
          </h2>
          <p className="text-xs text-muted font-medium">
            {user
              ? 'Vos animés, progression et notes sont sauvegardés sur Supabase.'
              : 'Synchronisez votre bibliothèque en temps réel sur tous vos appareils.'}
          </p>
        </div>

        {/* SI CONNECTÉ : Affichage du profil */}
        {user ? (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center font-bold text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Connecté en tant que</span>
                <span className="text-xs font-bold text-foreground truncate block">{user.email}</span>
              </div>
              <CheckCircle size={18} className="text-emerald-400 shrink-0" />
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <LogOut size={16} />
              <span>Se Déconnecter</span>
            </button>
          </div>
        ) : (
          /* SI NON CONNECTÉ : Formulaire Login / Register */
          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Champ Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted flex items-center gap-1.5">
                <Mail size={14} className="text-accent" />
                Adresse E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@gmail.com"
                className="w-full h-11 rounded-xl bg-white/5 border border-white/15 px-3.5 text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-all"
              />
            </div>

            {/* Champ Mot de Passe */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted flex items-center gap-1.5">
                <Lock size={14} className="text-accent" />
                Mot de Passe
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 rounded-xl bg-white/5 border border-white/15 px-3.5 text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-all"
              />
            </div>

            {/* Messages d'erreur et succès */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Bouton Soumettre */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-accent hover:bg-accent/90 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-accent/25 active:scale-95 transition-all"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>{isLogin ? 'Se Connecter & Synchroniser' : 'Créer mon Compte Cloud'}</span>
                </>
              )}
            </button>

            {/* Basculer entre Connexion et Inscription */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-xs text-muted hover:text-accent font-semibold transition-colors"
              >
                {isLogin
                  ? 'Pas encore de compte ? Créer un compte en 2 sec'
                  : 'Déjà un compte ? Se connecter'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
