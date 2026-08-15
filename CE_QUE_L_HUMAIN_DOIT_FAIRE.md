# 👤 CE_QUE_L_HUMAIN_DOIT_FAIRE.md — Guide Pas à Pas pour l'Utilisateur

Ce document est rédigé dans un langage clair et sans jargon technique complexe. Il récapitule **les seules et uniques actions que toi (l'humain)** dois faire lorsque tu démarres un nouveau projet à partir de ce template.

---

## 🛠️ Étape 1 : Le Lancement Local (À faire au démarrage)

Quand tu ouvres le dossier du projet dans ton éditeur de code :

1. **Installer les dépendances (si ce n'est pas déjà fait)** :
   Ouvre ton terminal et lance la commande suivante pour télécharger les briques logicielles :
   ```bash
   npm install
   ```
2. **Lancer le serveur de développement local** :
   Dans le terminal, tape :
   ```bash
   npm run dev
   ```
   L'application s'ouvre sur ton navigateur à l'adresse `http://localhost:5173/`. 
   
> 💡 *Note : L'application fonctionne à 100% en mode démo local même si tu n'as pas encore créé de base de données Supabase !*

---

## ⚡ Étape 2 : Connecter la Base de Données Supabase (5 minutes)

Lorsque tu souhaites connecter une vraie base de données en ligne pour ton application :

### 1. Obtenir tes Clés d'Accès Supabase
1. Rends-toi sur [supabase.com](https://supabase.com) et crée un nouveau projet (gratuit).
2. Va dans **Project Settings** (l'icône d'engrenage en bas à gauche) -> **API**.
3. Copie les deux valeurs suivantes :
   - **Project URL** (ex: `https://xyzxyz.supabase.co`)
   - **anon / public key** (une longue clé de lettres et chiffres).

### 2. Configurer le Fichier d'Environnement `.env`
À la racine de ton projet, crée un fichier nommé `.env` (ou duplique `.env.example`) et colle tes identifiants :

```env
VITE_SUPABASE_URL=https://ton-projet.supabase.co
VITE_SUPABASE_ANON_KEY=ta-cle-anon-publique
```

---

## 🗄️ Étape 3 : Initialiser la Base de Données (Script SQL)

Pour que la base de données comprenne la synchronisation temps réel multi-appareils et la sécurité de tes utilisateurs :

1. Dans ton tableau de bord Supabase, clique sur **SQL Editor** dans le menu de gauche.
2. Clique sur **New query** (Nouvelle requête).
3. Ouvre le fichier [`supabase/init_template.sql`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/supabase/init_template.sql) fourni dans ce projet, copie l'intégralité de son contenu et colle-le dans l'éditeur Supabase.
4. Clique sur le bouton vert **Run** en bas à droite.

> ✨ **C'est terminé !** Ta base de données est initialisée avec :
> - La table de synchronisation temps réel instantanée (`sync_metadata`).
> - Les règles de sécurité RLS (Row Level Security) qui empêchent un utilisateur d'accéder aux données d'un autre.
> - La publication WebSockets activée.

---

## 🎨 Étape 4 : Customiser l'Application pour un Nouveau Projet

Lorsque tu demandes à l'IA d'ajouter de nouvelles fonctionnalités :

1. **Pour modifier les couleurs ou les arrondis globaux** : Dis simplement à l'IA d'ajuster [`src/designSystem.js`](file:///D:/Documents/A_BUSINESS/Agence_Web/WebApp_Template/src/designSystem.js).
2. **Pour ajouter une nouvelle table dans Supabase** : Demande à l'IA de générer la table SQL avec le trigger de synchronisation `trigger_sync_[nom_table]` pour que la synchronisation multi-appareils continue de fonctionner sans effort !
