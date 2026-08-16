import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

// ── Skeleton Minimalist ────────────────────────────────────────────────────────
function HeroBannerSkeleton() {
  return (
    <div className="relative w-full aspect-[2/3] overflow-hidden bg-background">
      <div className="absolute inset-0 bg-surface/30 animate-pulse" />
    </div>
  );
}

// ── HeroBanner Minimaliste (Full Width) ────────────────────────────────────────
export default function HeroBanner({ anime, onNextAnime }) {
  if (!anime) return <HeroBannerSkeleton />;

  const { title, coverImage, bannerImage } = anime;

  const poster = coverImage?.extraLarge || coverImage?.large || coverImage?.medium;
  const banner = bannerImage || poster;
  const titleMain = title?.english || title?.userPreferred || title?.romaji || 'Sans titre';
  const titleSub = (title?.english && title?.romaji && title.english !== title.romaji) ? title.romaji : null;

  // Helper pour mettre une majuscule au premier mot seulement (Sentence Case)
  const formatSentenceCase = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const titleSubFormatted = titleSub ? formatSentenceCase(titleSub) : null;

  return (
    <div className="relative w-full overflow-visible bg-transparent">
      {/* ── Overscroll iOS Easter Egg : Bannière 16:9 infinie au-dessus ── */}
      {/* Astuce WebKit : absolute bottom-[100%] place l'élément juste au-dessus. 
          transform-gpu (translate3d) force iOS Safari à peindre ce layer même s'il est hors-champ, 
          résolvant le bug où la bannière était invisible au premier scroll vers le haut ! */}
      {banner && (
        <div className="absolute bottom-[100%] left-0 right-0 h-[100vh] overflow-hidden pointer-events-none z-0 transform-gpu will-change-transform">
          <img
            src={banner}
            alt="Overscroll Banner Easter Egg"
            className="w-full h-full object-contain object-bottom opacity-95"
            draggable={false}
          />
          {/* Dégradé doux en bas de la bannière d'overscroll */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40" />
        </div>
      )}

      {/* Cover verticale avec masque de transparence Alpha progressif */}
      {poster ? (
        <img
          src={poster}
          alt={titleMain}
          style={{
            maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
          }}
          className="w-full h-auto min-h-[60vh] max-h-[85vh] object-cover object-top block"
          draggable={false}
        />
      ) : (
        <div className="w-full h-[60vh] bg-transparent" />
      )}



      {/* Titre Hiérarchisé (Police N°2 Unbounded + 3 Lignes max + Majuscule 1er mot Romaji) */}
      <div
        style={{ bottom: '0px' }}
        className="absolute left-0 right-0 p-6 z-10 space-y-1.5"
      >
        {/* Titre Principal (Anglais) — Police N°2 Unbounded (3 Lignes max, Interlignage serré) */}
        {/* Mode Clair : halo blanc très concentré (0_0_12px_rgba(255,255,255,1)). Mode Sombre : ombre noire étendue */}
        <h1 className="font-['Unbounded'] font-black text-2xl sm:text-3xl leading-[1.02] text-foreground line-clamp-3 drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] dark:drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] tracking-tighter">
          {titleMain}
        </h1>

        {/* Sous-titre Japonais (Romaji) — Sans gras (font-normal) */}
        {titleSubFormatted && (
          <p className="font-['Unbounded'] text-foreground/75 font-normal text-xs sm:text-sm tracking-wide opacity-90 line-clamp-1 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            {titleSubFormatted}
          </p>
        )}
      </div>
    </div>
  );
}
