# 📘 Documentation Technique — WebApp Starter Kit Template

Ce document constitue la **référence d'architecture technique** de l'application. Il détaille le fonctionnement interne des composants fondamentaux du système de navigation, du layout et des modales d'interaction.

> 🛡️ **IMPORTANT FOR LLM & DEVS** : Pour consulter la liste des règles d'or et bonnes pratiques d'intégration UI/UX à respecter sans code en dur, référez-vous obligatoirement au fichier [`UI_BEST_PRACTICES.md`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/UI_BEST_PRACTICES.md).

---

## 📚 Sommaire
1. 🧠 [NavigationContext & Smart Memory](#1-navigationcontext--smart-memory)
2. 📱 [BottomNav & BottomNav3Tabs (Mobile Physics)](#2-bottomnav--bottomnav3tabs)
3. 🔝 [Header & Smart Back Hiérarchique](#3-header--smart-back-hiérarchique)
4. 🪟 [Modal, Bottom Sheet & Pattern Formulaire](#4-modal-bottom-sheet--pattern-formulaire)
5. 🔍 [SearchBar & Overlay Immersif (iOS Full-Screen Search)](#5--searchbar--overlay-immersif-ios-full-screen-search)
6. 🔽 [CustomSelect (Smart Direction Dropdown)](#6--customselect-smart-direction-dropdown)
7. 📝 [Form Inputs : GlassInput vs NumberInput](#7--form-inputs--glassinput-vs-numberinput)
8. 🔘 [Switch (Composant Tactile Liquide iOS)](#8--switch-composant-tactile-liquide-ios)

---

## 1. 🧠 NavigationContext & Smart Memory

**Fichier source** : [`src/context/NavigationContext.jsx`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/context/NavigationContext.jsx)

### Rôle & Fonctionnement
Le `NavigationContext` est le cerveau qui garde en mémoire la dernière sous-page visitée au sein de chaque onglet principal.
- Lorsqu'un utilisateur navigue au sein d'un onglet (ex: `/tab2/detail`), la clé mémoire correspondante (`memory.tab2`) est mise à jour avec l'URL complète (`fullPath`).
- Lorsqu'il clique à nouveau sur l'onglet dans la barre de navigation, l'application le ramène exactement là où il s'était arrêté au lieu de réinitialiser la vue à la racine.

### API & Exemple d'utilisation
```javascript
import { useNavigation } from '../context/NavigationContext';

const MyComponent = () => {
  const { memory } = useNavigation();
  console.log(memory.tab2); // Ex: "/tab2/detail"
};
```

---

## 2. 📱 BottomNav & BottomNav3Tabs

**Fichiers sources** : 
- [`src/components/layout/BottomNav.jsx`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/components/layout/BottomNav.jsx) (4 Onglets)
- [`src/components/layout/BottomNav3Tabs.jsx`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/components/layout/BottomNav3Tabs.jsx) (3 Onglets)

### Rôle & Physique Réfractive
La `BottomNav` est la barre de navigation mobile ancrée en bas d'écran. Elle repose sur le système **Liquid Glass** et une physique d'animation par ressorts (*Spring Physics*) via Framer-Motion.

### Principales Caractéristiques :
1. **Pilule Liquide Dynamique** : La pilule en verre suit le doigt lors du glissement et se déplace vers l'onglet sélectionné avec inertie.
2. **Support Clavier Virtuel** : Intègre le hook `useKeyboardStatus` pour se masquer automatiquement dès qu'un champ de formulaire est actif sur mobile (évite de recouvrir le clavier iOS/Android).
3. **Double Rendu de Démonstration** : Le template contient deux variantes (3 et 4 onglets) personnalisables via le tableau `NAV_CFG`.

---

## 3. 🔝 Header & Smart Back Hiérarchique

**Fichier source** : [`src/components/layout/Header.jsx`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/components/layout/Header.jsx)

### Rôle & Rétro-Navigation Intelligente
Le `Header` est la barre supérieure fixe floutée qui affiche le titre de la page actuelle et le bouton dynamique de retour.

### Algorithme du Smart Back :
Lorsqu'un utilisateur clique sur le bouton retour (flèche en haut à gauche) :
1. Si une fonction `handleSmartBack` personnalisée est fournie par le layout parent, elle est exécutée en priorité.
2. **Si l'utilisateur est dans une sous-page** (ex: `/tab2/detail`), le bouton effectue une **remontée hiérarchique** vers la racine de l'onglet parent (`/tab2`).
3. **Si l'utilisateur est à la racine d'un onglet**, il effectue un retour arrière dans l'historique du navigateur (`navigate(-1)`) ou ramène à l'accueil `/`.

---

## 4. 🪟 Modal, Bottom Sheet & Pattern Formulaire

**Fichiers sources** : 
- [`src/components/ui/Layout/Modal.jsx`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/components/ui/Layout/Modal.jsx)
- [`src/components/ui/Feedback/ConfirmModal.jsx`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/components/ui/Feedback/ConfirmModal.jsx)

### Architecture & Variants
Le composant `Modal.jsx` est un conteneur d'enveloppe universel qui utilise `createPortal` pour se projeter au-dessus de toute l'interface (au niveau de `document.body`).

Il propose **3 types de rendus** :
- `type="center"` : Modale flottante centrée (Desktop / Standard).
- `type="bottom"` : **Bottom Sheet Slide Up** avec tirette tactile iOS (*handlebar*) et gestion de la zone de sécurité (*safe-area-inset-bottom*).
- `type="alert"` : Dialogue compact pour alertes de confirmation (`ConfirmModal`).

### 🎨 Standardisation des 3 Configurations de Boutons

Pour garantir une expérience utilisateur (UX) fluide, prévisible et uniforme sur toute l'application, tous les pieds de page (`footer`) et formulaires utilisent **exclusivement les 3 configurations de boutons standardisées ci-dessous** (pilotées globalement par `UI.buttons.primary` dans `designSystem.js`) :

---

#### 1. Configuration 1 : Le Grand Bouton Unique (`Primary`)
* **Usage** : Utilisé lorsqu'il n'y a qu'une seule action principale à valider (ex: *"Valider et Continuer"*, *"Créer un compte"*).
* **Code** :
  ```jsx
  <Button variant="primary" className="w-full">
    Valider et Continuer
  </Button>
  ```

---

#### 2. Configuration 2 : Bouton Large + Bouton Carré Action (`Primary + Square`)
* **Usage** : Formulaires de modification/édition nécessitant une action principale (enregistrer) ET une action d'appoint rapide (généralement la suppression / poubelle).
* **Code** :
  ```jsx
  <div className="flex gap-3 w-full">
    <Button variant="danger" isSquare={true} onClick={handleDelete}>
      <Trash2 size={24} />
    </Button>
    <Button variant="primary" className="w-full" onClick={handleSave}>
      Enregistrer l'élément
    </Button>
  </div>
  ```

---

#### 3. Configuration 3 : Deux Boutons Égaux (`50% / 50%`)
* **Usage** : Dialogue de confirmation ou choix binaire à importance équivalente (`ConfirmModal`, *"Annuler"* / *"Confirmer"*).
* **Code** :
  ```jsx
  <div className="flex gap-3 w-full">
    <Button variant="ghost" className="flex-1" onClick={onClose}>
      Annuler
    </Button>
    <Button variant="primary" className="flex-1" onClick={onConfirm}>
      Confirmer
    </Button>
  </div>
  ```

---

### Pattern d'Injection de Formulaire (Best Practice)
Les modales n'incluent pas de logique métier interne. Elles reçoivent un composant de formulaire enfant (`children`) et un pied de page d'action fixe (`footer`) :

```jsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  type="bottom"
  title="Modifier l'élément"
  footer={
    <div className="flex justify-end gap-2">
      <Button variant="ghost" onClick={handleClose}>Annuler</Button>
      <Button variant="primary" onClick={handleSubmit}>Enregistrer</Button>
    </div>
  }
>
  <form onSubmit={handleSubmit} className="space-y-4">
    <GlassInput label="Nom" placeholder="Saisir..." />
  </form>
</Modal>
```

---

## 5. 🔍 SearchBar & Overlay Immersif (iOS Full-Screen Search)

**Fichier source** : [`src/components/ui/Forms/SearchBar.jsx`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/components/ui/Forms/SearchBar.jsx)

### Rôle & Architecture de Rendu
Le composant `SearchBar` n'est pas un simple champ texte d'entrée. C'est un **Trigger d'Overlay Immersif** conçu sur le modèle de recherche natif iOS (Spotlight / Apple Music) :

1. **Phase 1 : Le Trigger Statique** :
   Dans la page, la barre apparaît comme un champ discret. Un clic dessus déclenche `setIsFocused(true)`.
2. **Phase 2 : L'Overlay Immersif (`createPortal`)** :
   - Un fond flouté plein écran (`bg-background/80 backdrop-blur-md`) est projeté à la racine du document.
   - La véritable barre de recherche glisse vers le haut (`initial={{ y: -20 }}`) et prend automatiquement le focus du clavier mobile (`overlayInputRef.current.focus()`).
   - Les résultats (`children`) s'animent de bas en haut avec un effet de ressort et une liste défilable indépendante.

### Exemple d'utilisation dans vos pages :
```jsx
const [query, setQuery] = useState('');
const [isFocused, setIsFocused] = useState(false);

<SearchBar
  value={query}
  onChange={setQuery}
  placeholder="Rechercher..."
  isFocused={isFocused}
  setIsFocused={setIsFocused}
>
  {/* Les résultats s'affichent dynamiquement dans l'overlay */}
  {results.map(item => (
    <ListCard key={item.id} title={item.name} />
  ))}
</SearchBar>
```

---

## 6. 🔽 CustomSelect (Smart Direction Dropdown)

**Fichier source** : [`src/components/ui/Forms/CustomSelect.jsx`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/components/ui/Forms/CustomSelect.jsx)

### Rôle & Calcul Dynamique de Direction
Le `CustomSelect` est le composant de choix déroulant sur mesure qui remplace la balise `<select>` native du navigateur.

### Points Forts d'Ingénierie :
1. **Direction d'Ouverture Intelligente (`opensUp`)** : Avant de s'ouvrir, le composant calcule la distance restante entre le bouton et le bas du navigateur (`window.innerHeight - rect.bottom`). Si l'espace est insuffisant, le menu s'ouvre **vers le haut** (`opensUp = true`) pour ne jamais sortir de l'écran.
2. **Projections Portal (`createPortal`)** : Rendu directement au niveau de `document.body` avec `z-[20000]`.
3. **Fermeture Événementielle** : Se ferme automatiquement si l'utilisateur défile (*scroll*), redimensionne l'écran ou clique hors de la zone.

---

## 7. 📝 Form Inputs : GlassInput vs NumberInput

**Fichiers sources** :
- [`src/components/ui/Forms/GlassInput.jsx`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/components/ui/Forms/GlassInput.jsx) (Enveloppe Design + Sécurité Texte/Number)
- [`src/components/ui/Forms/NumberInput.jsx`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/components/ui/Forms/NumberInput.jsx) (Moteur Numérique Ultra-Sécurisé)

### 📊 Tableau Comparatif : Qui fait Quoi ?

| Caractéristique | `GlassInput.jsx` | `NumberInput.jsx` |
| :--- | :--- | :--- |
| **Rôle Principal** | **Enveloppe Visuelle & Conteneur** (Design System, Label, Icônes, Variants de verre, Compteur de caractères). | **Moteur Numérique Pur** (Sécurité de saisie financière et clavier mobile). |
| **Styles & Variants** | Gère les 4 variants de verre : `glass`, `smoky`, `pill`, `plain`. | 100% Transparent (`bg-transparent border-none p-0`). S'insère dans n'importe quel conteneur. |
| **Clavier Mobile** | Bascule automatiquement en `inputMode="decimal"` si `type="number"`. | Impose le clavier numérique decimal (`inputMode="decimal"` + `type="number"`). |
| **Blocage de Touches** | Bloque les touches scientifiques `e`, `E`, `+`, `-`. | Bloque `e`, `E`, `+`, et bloque `-` si `min >= 0`. |
| **Sécurité Molette Mouse** | N/A | **Neutralise le scroll de la molette de la souris** (`onWheel` blur) qui modifie accidentellement les montants ! |
| **Conversion Fr/En** | Remplace les virgules `,` par des points `.`. | Accepte les valeurs décimales nettoyées. |

### 💡 Quand utiliser lequel ?
- **Utiliser `GlassInput`** : Pour **90% des champs de formulaires** (Texte, Recherche, Email, Zone de texte multi-lignes, ou Saisie numérique standard avec label et icône).
- **Utiliser `NumberInput`** : Pour les **champs de montants financiers ou de calculs critiques** où vous souhaitez neutraliser la molette de la souris, interdire strictement les nombres négatifs (`min={0}`) et insérer la saisie dans un conteneur personnalisé.

---

## 8. 🔘 Switch (Composant Tactile Liquide iOS)

**Fichier source** : [`src/components/ui/Forms/Switch.jsx`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/components/ui/Forms/Switch.jsx)

### Architecture Tactile Haute Performance
Le composant `Switch.jsx` est l'un des éléments UI les plus avancés du starter kit. Il reproduit la physique de glissement et de pression des sélecteurs natifs iOS Apple :

### 🎨 Les 2 Styles Officiels de Switch

1. **Type 1 : Switch Classique (Translucide & Coloré par défaut)**
   - **Usage** : Utilisé pour les sélecteurs et bascules principales (ex: *"Dépense / Revenu"*, *"Off / On"*).
   - **Visuel** : Conteneur `glass-panel` avec pilule translucide teintée avec la couleur d'accentuation (`accent`) ou personnalisée (`color="success"`, `color="danger"`).

2. **Type 2 : Switch Secondaire Monochrome (`size="sm" color="foreground"`)**
   - **Usage** : Utilisé dans les pages comme `Resell.jsx` pour les barres de filtres d'articles (*Tous / Stock / Vendu*) et filtres de lots (*Actif / Archivé*).
   - **Visuel & Gabarit** : Plus fin et plus petit (`size="sm"` h: 40px contre h: 52px pour le principal). La pilule devient **blanche solide en Dark Mode** et **noire solide en Light Mode** avec un conteneur monochrome discret (`bg-black/5 dark:bg-white/5`).

---

### 🧩 Modularité Dynamique de 1 à 6 Options
Contrairement aux boutons bascules rigides du web classique, `Switch.jsx` calcule dynamiquement la largeur de chaque segment (`pillWidthPx = calc(100% / n)`) et la position exacte du centre de chaque emplacement (`slotCenter`).
- **Supporte de 1 à 6 choix** dans un seul composant (ex: binaire `[Off, On]`, 3 fréquences `[Jour, Semaine, Mois]`, ou 4 sous-onglets `[Tab1, Tab2, Tab3, Tab4]`).

---

### ⚡ Architecture Tactile & Pourquoi il ne plante jamais sur Safari iOS :
1. **L'Overlay de Capture Invisible (`z-20 Pointer Capture`)** : Au lieu d'écouter les clics sur les boutons texte, le composant utilise un `div` transparent superposé sans sémantique interactive (`touch-action: none`). iOS ne lui applique **aucun gesture recognizer natif**, évitant les sauts de page et conflits tactiles.
2. **Physique par Ressorts (*Framer Motion Spring*)** : Utilise `stiffness: 480, damping: 32` pour un déplacement de la pilule en verre d'une fluidité naturelle.
3. **Lock de Direction Dédié (`horizontal` vs `vertical`)** : Si l'utilisateur fait un geste de défilement vertical de la page (*scroll*), le composant relâche automatiquement la capture (`releasePointerCapture`) pour laisser la page défiler sans bloquer le doigt.

---

## 9. 📊 Cartes & Composants de Données (KPICard, BigNumber, ListCard & ShowMore)

**Fichiers sources** :
- [`src/components/ui/Layout/KPICard.jsx`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/components/ui/Layout/KPICard.jsx) (Métriques & Tendance)
- [`src/components/ui/Layout/BigNumber.jsx`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/components/ui/Layout/BigNumber.jsx) (Montant Héro + Halo lumineux)
- [`src/components/ui/Layout/ListCard.jsx`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/components/ui/Layout/ListCard.jsx) (Items de liste avec props ou enfants)
- [`src/components/ui/Primitives/ShowMore.jsx`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/components/ui/Primitives/ShowMore.jsx) (Bouton d'extension de liste)

### 🚀 Guide d'Utilisation :
1. **`KPICard.jsx`** : Accepte les props `title`, `value`, `subtext`, `trend` (nombre positif/négatif) et `icon`. Format de carte compact de tableau de bord.
2. **`BigNumber.jsx`** : Affiche les montants monétaires massifs avec animation d'entrée ressort, conversion automatique en `EUR` (`Intl.NumberFormat`), lueur réfractive en arrière-plan et sous-valeurs d'évolution.
3. **`ListCard.jsx`** : Supporte une syntaxe flexible soit via des props explicites (`title`, `subtitle`, `leftIcon`, `rightContent`), soit via des enfants personnalisés JSX (`children`).
4. **`ShowMore.jsx`** : Gère la pagination ou le chargement progressif des listes défilantes.
