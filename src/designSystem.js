// --- STRICT SEMANTIC UI TOKENS ---
export const COLORS = {
  primary: 'bg-accent',
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  surface: 'bg-surface',
  card: 'bg-card',
  border: 'border-border',
  text: 'text-foreground',
};

export const SHAPES = {
  bigbox: 'rounded-bigbox',
  card: 'rounded-card',
  list: 'rounded-list',
  field: 'rounded-field',
  button: 'rounded-[1.6rem]', // 👈 Arrondi d'origine par défaut (Point unique)
};

export const UI = {
  // Layout
  layout: {
    sidebarWidth: 'w-72',
    topMargin: 'top-4 md:top-6',
    mainOffset: 'md:pl-[336px]',
    headerOffset: 'md:left-[336px]',
    pagePadding: 'px-4 md:px-0 md:pr-10',
    verticalSpacer: 'pt-[calc(6rem+env(safe-area-inset-top,0px))] pb-32',
    container: 'w-full relative min-h-full max-w-7xl mx-auto',
  },

  cards: {
    base: "bg-card border border-border shadow-sm",
    // --- LIQUID GLASS PROGRESSION (Global default) ---
    glass: "glass-liquid rounded-card transition-all hover:border-accent/30",
    glassStatic: "glass-liquid rounded-card",
    glassLiquidSolid: "glass-liquid-solid rounded-card transition-all",

    smoky: "bg-surface/10 border border-border rounded-card backdrop-blur-sm transition-colors focus-within:bg-surface/20 focus-within:border-accent/30",
    smokyStatic: "bg-surface/10 border border-border rounded-card backdrop-blur-sm",
    flexible: {
      standard: "rounded-card p-6",
      large: "rounded-bigbox p-6",
      interactive: "cursor-pointer transition-all active:scale-[0.99] active:bg-accent/5 touch-manipulation",
    },
    list: "w-full text-left glass-liquid-lite rounded-list p-4 transition-all duration-300 flex items-center justify-between group hover:border-accent/30 hover:bg-white/5 active:scale-[0.98]",
    kpi: "glass-liquid rounded-card p-6 flex flex-col justify-between transition-all shadow-sm hover:border-accent/30 hover:bg-white/5",
    kpiInteractive: "cursor-pointer transition-all card-interactive hover:border-accent/30",
  },

  buttons: {
    base: "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-widest transition-all disabled:cursor-not-allowed active:scale-[0.98]",

    // --- BOUTONS PRIMAIRES (Catégorie Principale) ---
    primary: {
      height: "h-14",             // 👈 Taille/Hauteur réglable pour TOUS les boutons primaires
      rounded: SHAPES.button,     // 👈 Arrondi réglable pour TOUS les boutons primaires
      padding: "px-6",
      textSize: "text-xs",
    },

    // --- PRÉPARATION FUTURE : BOUTONS SECONDAIRES ---
    secondary: {
      height: "h-10",             // 👈 Prêt pour les futurs boutons secondaires
      rounded: "rounded-xl",
      padding: "px-4",
      textSize: "text-[10px]",
    },

    variants: {
      primary: "bg-accent text-white hover:bg-accent-hover shadow-lg border border-transparent",
      success: "bg-success text-white hover:bg-emerald-500 shadow-lg border border-transparent",
      outline: "border border-border text-foreground hover:bg-surface disabled:opacity-30",
      ghost: "text-foreground hover:bg-surface disabled:opacity-30 shadow-none border border-transparent",
      danger: "bg-danger text-white hover:bg-red-500 shadow-lg border border-transparent",
      warning: "bg-warning text-black hover:bg-amber-500 shadow-lg border border-transparent",
    },
  },

  forms: {
    input: "w-full bg-surface border border-border focus:border-accent py-3 px-4 text-foreground outline-none transition-all placeholder:text-dim rounded-field",
    label: "block text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5 ml-1",
    labelSmoky: "text-[10px] text-gray-400 font-bold uppercase block mb-1",
  },

  switches: {
    heights: {
      sm: "h-[40px] p-0.5",
      md: "h-[52px] p-1",
      lg: "h-[60px] p-1.5",
    },
    sizes: {
      sm: { h: 40, inset: 2, text: 'text-[9px] gap-1 px-1', icon: 14 },
      md: { h: 52, inset: 4, text: 'text-[10px] gap-2', icon: 16 },
      lg: { h: 60, inset: 5, text: 'text-xs gap-3.5', icon: 18 },
    }
  },

  text: {
    h1: "text-4xl md:text-5xl font-black tracking-tighter text-foreground",
    h2: "text-2xl font-bold text-foreground/90",
    h3: "text-xl font-bold text-foreground/80",
    body: "text-sm text-muted font-medium",
    label: "text-[11px] font-bold text-muted uppercase tracking-widest",
    labelAccent: "text-[11px] font-bold text-accent uppercase tracking-widest",
    cardTitle: "text-base font-black text-foreground uppercase tracking-tighter",
    number: {
      lg: "text-3xl font-black tracking-tight",
      md: "text-xl font-bold",
      sm: "font-bold text-sm",
    }
  },

  components: {
    progressBar: {
      container: "w-full bg-background rounded-full overflow-hidden h-4",
      fill: "h-full bg-pink-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(236,72,153,0.4)]"
    },
    actionIcon: "h-[52px] w-[52px] rounded-full shrink-0 flex items-center justify-center glass-liquid text-muted transition-all cursor-pointer hover:shadow-lg hover:scale-110 active:scale-95 hover:text-accent active:text-accent group hover:border-accent/30"
  }
};

export const ANIMATIONS = {
  modalDuration: 400,
};
