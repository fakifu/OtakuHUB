/**
 * auroraPresets.js — Gradient blobs configurables + Interaction Fluide
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  🎨  CONFIGURATION — Modifier ici pour personnaliser          │
 * │  Les valeurs sont des RGB [0-1]. Ex: rouge = [1, 0, 0]       │
 * └──────────────────────────────────────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PRESET OLED — Palette Indigo / Bleu profond / Turquoise (Cohérence Light)
// ═══════════════════════════════════════════════════════════════════════════════
export const OLED_CONFIG = {
  bg: [0.000, 0.000, 0.000],
  // ── 5 halos orbitaux — Indigo profond / Violet nuit ───────────────
  // Simulation de l'intensité Ivory avec des couleurs assombries pour OLED
  blobs: [
    [0.08, 0.15, 0.35],   // Bleu Nuit profond
    [0.15, 0.08, 0.25],   // Violet sombre
    [0.05, 0.20, 0.45],   // Bleu Cobalt nocturne
    [0.20, 0.10, 0.30],   // Indigo 
    [0.10, 0.15, 0.40],   // Bleu mystique
  ],

  // ── Halo du doigt ──────────────────────────────────────────────
  mouseBlob: [0.15, 0.15, 0.25], // Gris/Bleu cendré

  // Mêmes tailles immenses que IVORY pour la vaporeusité
  sizes: [0.52, 0.48, 0.58, 0.42, 0.36],
  mouseBlobSize: 0.35,

  // Même intensité que IVORY, la noirceur vient des teintes RGB basses
  intensity: 0.88,
  grain: 0.035,
  speed: 0.20,
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRESET IVORY — Couleurs accentuées (Bleu / Lavande / Rose)
// ═══════════════════════════════════════════════════════════════════════════════
export const IVORY_CONFIG = {
  bg: [0.966, 0.966, 0.990],

  blobs: [
    [0.25, 0.55, 0.99],   // 🔵 Bleu roi saturé
    [0.60, 0.40, 0.98],   // 🟣 Violet profond
    [0.98, 0.35, 0.65],   // 🩷 Rose vif saturé
    [0.15, 0.50, 0.95],   // 🔵 Bleu océan
    [0.45, 0.70, 0.99],   // 🔵 Bleu azur
  ],

  mouseBlob: [0.95, 0.60, 0.95],

  sizes: [0.52, 0.48, 0.58, 0.42, 0.36],
  mouseBlobSize: 0.35,

  intensity: 0.88, // Bien accentué pour visibilité sur blanc
  grain: 0.015,
  speed: 0.20,
};

// ─────────────────────────────────────────────────────────────────────────────
// buildShader : Génère le GLSL avec DISTORSION FLUIDE (Interaction par le doigt)
// ─────────────────────────────────────────────────────────────────────────────
function v3(arr) {
  return `vec3(${arr.map(v => v.toFixed(4)).join(',')})`;
}

function buildShader(cfg, mode) {
  const B = cfg.blobs;
  const S = cfg.sizes;
  const isDark = mode === 'dark';

  return `
precision mediump float;
uniform float uTime;
uniform vec2  uRes;
uniform vec2  uMouse;
uniform vec2  uPositions[5]; // Positions injectées par le moteur physique JS

float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float blob(vec2 p,vec2 c,float r){float d=length(p-c)/r;return exp(-d*d*1.5);}

// ── Couleurs baked
const vec3 BG  =${v3(cfg.bg)};
const vec3 BC0 =${v3(B[0])};
const vec3 BC1 =${v3(B[1])};
const vec3 BC2 =${v3(B[2])};
const vec3 BC3 =${v3(B[3])};
const vec3 BC4 =${v3(B[4])};
const vec3 BCM =${v3(cfg.mouseBlob)};
const float I  =${cfg.intensity.toFixed(3)};
const float GR =${cfg.grain.toFixed(4)};

void main(){
  vec2 uv=gl_FragCoord.xy/uRes.xy;
  float ar=uRes.x/uRes.y;
  // Espace corrigé (0 à ar en X, 0 à 1 en Y)
  vec2 p=vec2(uv.x*ar,uv.y);
  vec2 ms=vec2(uMouse.x*ar,uMouse.y);

  float scl=min(ar,1.0);

  // 🧪 INTERACTION FLUIDE LOCALE : Le doigt déforme le maillage UV (Effet loupe)
  float distToMouse = length(p-ms);
  float force = exp(-distToMouse*distToMouse*4.0);
  p += (p-ms)*force*0.08;

  // ── Positions physiques depuis JS ─────────────────────────────────────────
  // Note : les valeurs uPositions fournies par JS sont normalisées [0-1].
  // On doit les scaler par 'ar' sur l'axe X pour matcher l'espace de p.
  vec2 c0=vec2(uPositions[0].x*ar, uPositions[0].y);
  vec2 c1=vec2(uPositions[1].x*ar, uPositions[1].y);
  vec2 c2=vec2(uPositions[2].x*ar, uPositions[2].y);
  vec2 c3=vec2(uPositions[3].x*ar, uPositions[3].y);
  vec2 c4=vec2(uPositions[4].x*ar, uPositions[4].y);

  // ── Rayons scalés
  float b0=blob(p,c0,${S[0].toFixed(3)}*scl)*I;
  float b1=blob(p,c1,${S[1].toFixed(3)}*scl)*I;
  float b2=blob(p,c2,${S[2].toFixed(3)}*scl)*I;
  float b3=blob(p,c3,${S[3].toFixed(3)}*scl)*I;
  float b4=blob(p,c4,${S[4].toFixed(3)}*scl)*I;
  // Blob souris
  float bm=blob(p,ms,${cfg.mouseBlobSize.toFixed(3)}*scl)*I*0.60;

  // ── Rendu (Cohérent Light / Dark : Mélange proportionnel) ──────────────
  // On additionne les blobs pour avoir la densité locale (0 à X)
  float total=b0+b1+b2+b3+b4+bm;
  
  // On calcule la couleur mélangée pondérée par la présence locale
  vec3 blobMix=(BC0*b0+BC1*b1+BC2*b2+BC3*b3+BC4*b4+BCM*bm)/max(total,0.001);
  
  // On "peint" le fond vers cette couleur avec un plafond (0.92) et la densité clampée
  vec3 col=mix(BG, mix(BG,blobMix,0.92), clamp(total*0.75,0.,0.92));

  col+=(hash(uv+fract(uTime*0.07))-0.5)*GR;
  gl_FragColor=vec4(clamp(col,0.,1.),1.0);
}`;
}

const OLED_FRAG = buildShader(OLED_CONFIG, 'dark');
const IVORY_FRAG = buildShader(IVORY_CONFIG, 'light');

export const AURORA_PRESETS = {
  dark: { id: 'oled', frag: OLED_FRAG },
  light: { id: 'ivory', frag: IVORY_FRAG },
};
