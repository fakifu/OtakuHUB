import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { getTrendingAnime } from '../services/anilistService';
import Switch from '../components/ui/Forms/Switch';

export default function UITestPage() {
  const [selectedFont, setSelectedFont] = useState('syne');
  const [animeList, setAnimeList] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getTrendingAnime(1, 15);
        if (data && data.length > 0) {
          setAnimeList(data);
          setHeroIndex(0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleNextAnime = () => {
    if (animeList.length === 0) return;
    setHeroIndex((prev) => (prev + 1) % animeList.length);
  };

  const fontOptions = [
    { value: 'syne', label: '1' },
    { value: 'unbounded', label: '2' },
    { value: 'space', label: '3' },
    { value: 'cinzel', label: '4' },
    { value: 'outfit', label: '5' },
  ];

  const FONT_CLASSES = {
    syne: "font-['Syne'] font-extrabold tracking-tight",
    unbounded: "font-['Unbounded'] font-black tracking-tighter",
    space: "font-['Space_Grotesk'] font-bold tracking-tight",
    cinzel: "font-['Cinzel'] font-black tracking-normal uppercase",
    outfit: "font-['Outfit'] font-black tracking-tight",
  };

  if (loading || animeList.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center text-foreground font-bold bg-background">
        Chargement des polices et animés...
      </div>
    );
  }

  const anime = animeList[heroIndex];
  const poster = anime.coverImage?.extraLarge || anime.coverImage?.large || anime.coverImage?.medium;
  const titleMain = anime.title?.english || anime.title?.userPreferred || anime.title?.romaji || 'Sans titre';
  const titleSub = (anime.title?.english && anime.title?.romaji && anime.title.english !== anime.title.romaji) ? anime.title.romaji : null;

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background text-foreground">
      {/* Switcher de Polices compact (1, 2, 3, 4, 5) fixe en haut */}
      <div className="fixed top-14 left-4 right-16 z-[9990]">
        <Switch
          size="sm"
          color="foreground"
          options={fontOptions}
          value={selectedFont}
          onChange={setSelectedFont}
        />
      </div>

      {/* Bouton Double Flèche (RefreshCw) en haut à droite pour changer d'animé */}
      <button
        type="button"
        onClick={handleNextAnime}
        className="fixed top-[calc(4.2rem+env(safe-area-inset-top,0px))] right-4 z-[9999] w-10 h-10 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-accent shadow-xl border border-white/20 active:scale-95 active:rotate-180 transition-all"
        title="Changer d'animé à la une"
      >
        <RefreshCw size={18} className="text-cyan-400" />
      </button>

      {/* Rendu Démonstratif exact au pixel près comme le vrai Dashboard */}
      <div className="w-full relative min-h-full max-w-lg mx-auto">
        <div className="relative w-full overflow-hidden bg-transparent">
          {poster ? (
            <img
              src={poster}
              alt={titleMain}
              style={{
                maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
              }}
              className="w-full h-auto min-h-[60vh] max-h-[85vh] object-cover object-top block"
            />
          ) : (
            <div className="w-full h-[60vh] bg-transparent" />
          )}

          {/* Titre avec la Police Appliquée & Positionnement Dashboard au pixel près */}
          <motion.div
            key={anime.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ bottom: '0px' }}
            className="absolute left-0 right-0 p-6 z-10 space-y-1"
          >
            <h1 className={`${FONT_CLASSES[selectedFont]} text-foreground text-3xl sm:text-4xl leading-tight line-clamp-2 drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] dark:drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]`}>
              {titleMain}
            </h1>

            {titleSub && (
              <p className="text-foreground/80 font-semibold text-xs sm:text-sm tracking-wide lowercase opacity-90 line-clamp-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                {titleSub}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
