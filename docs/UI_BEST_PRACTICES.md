# 🛡️ UI_BEST_PRACTICES.md — Guide Officiel des Bonnes Pratiques UI/UX

> **INSTRUCTION OBLIGATOIRE POUR LES LLM & DÉVELOPPEURS** :
> Ce document définit les **règles d'or d'ingénierie UI/UX** du Starter Kit. Tout code écrit dans cette application DOIT se conformer strictly aux standards ci-dessous. Interdiction absolue d'écrire des styles ad-hoc ou du code en dur.

---

## 1. 🎯 La Règle d'Or : Source Unique de Vérité (SSOT)

Aucun composant de l'application ne doit posséder de hauteurs, d'arrondis ou de styles globaux codés en dur dans son JSX. Tout est piloté par [`src/designSystem.js`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/designSystem.js).

### A. Gestion des Boutons (`Button.jsx`)
- **Hauteur & Arrondi Unique** : Tous les boutons primaires de l'application consomment `UI.buttons.primary` (`h-14` / `56px` et `SHAPES.button` = `rounded-[1.3rem]`).
- **Ne JAMAIS passer de prop `size="sm"` ou `size="action"`**. Tout bouton standard prend automatiquement la taille unique par défaut.
- **Bouton Carré (ex: Poubelle)** : Utiliser uniquement la prop `isSquare={true}` sur `<Button />`. Il héritera automatiquement de la même hauteur (`h-14`) et ajustera sa largeur (`w-14`) pour former un carré parfait.

```jsx
// ❌ INTERDIT (Code en dur / Tailles parasites)
<Button size="action" className="h-12 rounded-full">Valider</Button>
<Button size="squareAction" className="w-12 h-12">Delete</Button>

// ✅ OBLIGATOIRE (Propre & Centralisé)
<Button variant="primary" className="w-full">Valider</Button>
<Button variant="danger" isSquare={true} leftIcon={Trash2} />
```

---

## 2. 🪟 Modales & Structuration des Formulaires

- **Zero sur-couche englobante** : Les modales injectent leurs formulaires directement via `children` et les boutons via `footer`.
- **Pas de tirette manuelle** : Les modales `type="bottom"` gèrent leur affichage fluide sans ajouter d'éléments graphiques parasites.
- **Les 3 Configurations de Boutons en Footer** :
  1. **Action Unique** : `<Button variant="primary" className="w-full">Action</Button>`
  2. **Action + Poubelle** : `<Button variant="danger" isSquare={true} />` + `<Button variant="primary" className="w-full" />`
  3. **Binaire 50%/50%** : `<Button variant="ghost" className="flex-1" />` + `<Button variant="primary" className="flex-1" />`

---

## 3. 🎨 Textures & Intégration des Forms

- **Champs Texte & Selects (`GlassInput` vs `CustomSelect`)** :
  Le `CustomSelect` et `GlassInput` doivent avoir **strictement le même visuel** (`glass-panel rounded-card h-14 px-4`).
- **Switches Tactiles iOS (`Switch.jsx`)** :
  - **Switch Principal (Taille standard `52px`)** : `<Switch checked={val} onChange={setVal} />` (pour les onglets de page).
  - **Switch Secondaire (Taille fine `40px` monochrome)** : `<Switch size="sm" color="foreground" checked={val} onChange={setVal} />` (pour les filtres de cartes).

---

## 4. 📄 Pagination & Emboîtement de Listes (`ShowMore.jsx`)

- **Intégration Directe** : Le composant `<ShowMore />` fait partie intégrante du conteneur de liste (`space-y-2`).
- **Interdiction du `pt-2` ou du wrapper externe** : Ne jamais englober `<ShowMore />` dans un `<div className="pt-2">` séparé. Il doit être le **dernier enfant direct** du même conteneur `space-y-2` que les cartes `<ListCard />`.

```jsx
// ❌ INTERDIT (Crée un écart parasite de 28px)
<div className="space-y-2">
  {items.map(i => <ListCard key={i} />)}
</div>
<div className="pt-2">
  <ShowMore isVisible={true} />
</div>

// ✅ OBLIGATOIRE (Écart parfait de 8px unifié)
<div className="space-y-2">
  {items.map(i => <ListCard key={i} />)}
  <ShowMore isVisible={true} />
</div>
```

---

## 5. 🏢 Disposition des Pages (Découpage & Respiration)

- **Interdiction de l'effet "Mille-Feuille"** : Ne jamais empiler une grande carte `glass-liquid` autour d'autres cartes `glass-panel`.
- **Page Défilante Aérée** : Poser chaque composant de carte (`KPICard`, `BigNumber`, `ListCard`) comme des éléments autonomes flottants directement dans le flux de la page.

---

## 6. 🌐 Backend, Timezone & Synchronisation Temps Réel

### A. Règle d'Or des Dates & Timezones (`src/utils/date.js`)
- **Stockage en Base de Données (Supabase)** : Toujours transmettre une chaîne ISO UTC (`toUTCISO(dateInput)`).
- **Affichage & Inputs** : Utiliser `toInputDate(isoString)` pour remplir les `<input type="date">` sans décalage de journée (évite le bug du jour précédent à minuit).

### B. Synchronisation Multi-Appareils (`SmartSyncManager.jsx`)
- Ne jamais surcharger l'application avec 15 écouteurs WebSockets lourds.
- Écouter exclusivement la table metadata `sync_metadata`. Dès qu'un changement survient, invalider la clé React Query correspondante via `queryClient.invalidateQueries`.

### C. Opérations Atomiques avec Rollback (`src/services/bridgeService.js`)
- Pour lier deux écritures dans deux tables différentes (ex: Virement Business -> Transaction Perso), générer un `link_id = crypto.randomUUID()`.
- Exécuter les requêtes via `Promise.all`. Si la seconde requête échoue, supprimer automatiquement le premier enregistrement (Rollback automatique).

---

## 7. 📱 PWA Mobile & Hooks iOS

- **Clavier Virtual iOS (`useKeyboardStatus`)** : Utiliser ce hook pour masquer automatiquement la `BottomNav` lorsqu'un champ texte est en cours de saisie.
- **Anti-Rebond iOS (`useLockBodyScroll`)** : Intégré automatiquement dans les modales et overlays pour neutraliser le scroll "Rubber-Band" natif de Safari.
- **Calculs Métier Pur (`src/utils/`)** : Toute formule mathématique ou logique métier doit vivre dans un fichier JS pur dans `src/utils/`. Ne jamais écrire de calculs d'impôts ou de ratios financiers directement dans le rendu JSX d'un composant React.
