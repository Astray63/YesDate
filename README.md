# YesDate - Application de Rencontres pour Couples

Une application mobile React Native avec Expo qui aide les couples à découvrir des idées de dates personnalisées grâce à l'IA.

## 🎯 Fonctionnalités

- **Quiz interactif** : Questions rapides avec emojis pour déterminer les préférences
- **Swipe Tinder-like** : Interface de carte pour liker/rejeter les idées de dates
- **Matching intelligent** : Voir les dates où les deux partenaires ont matché
- **IA personnalisée** : Génération d'idées via OpenRouter API
- **Authentification** : Inscription/connexion avec codes d'invitation pour couples

## 🚀 Installation

### Prérequis

- Node.js (version 20.19.4 ou plus récente)
- npm ou yarn
- Expo CLI : `npm install -g @expo/cli`
- Un appareil mobile ou émulateur

### Installation du projet

1. **Cloner et installer les dépendances**

```bash
# Cloner le projet
git clone <votre-repo>
cd YesDateApp

# Installer les dépendances principales
npm install

# Installer les dépendances backend
cd backend
npm run install-deps
cd ..
```

2. **Configuration des variables d'environnement**

Copiez le fichier `.env.example` vers `.env` et remplissez vos clés :

```bash
cp .env.example .env
```

Éditez le fichier `.env` :

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anonyme-supabase

# OpenRouter API Configuration
EXPO_PUBLIC_OPENROUTER_API_KEY=votre-cle-openrouter

# Stripe Configuration (optionnel)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=votre-cle-publishable-stripe
```

### Configuration Supabase

1. **Créer un projet Supabase**
   - Allez sur [supabase.com](https://supabase.com)
   - Créez un nouveau projet
   - Récupérez l'URL et la clé anonyme dans les paramètres

2. **Créer les tables**

```sql
-- Table des profils utilisateurs
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  partner_id UUID REFERENCES profiles(id),
  invitation_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des réponses au quiz
CREATE TABLE quiz_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  question_id TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des idées de dates
CREATE TABLE date_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  duration TEXT,
  category TEXT,
  difficulty TEXT,
  cost TEXT,
  location_type TEXT,
  generated_by TEXT DEFAULT 'ai',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des swipes
CREATE TABLE date_swipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  date_idea_id UUID REFERENCES date_ideas(id) NOT NULL,
  direction TEXT CHECK (direction IN ('left', 'right')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date_idea_id)
);

-- Table des matches
CREATE TABLE date_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES profiles(id) NOT NULL,
  user2_id UUID REFERENCES profiles(id) NOT NULL,
  date_idea_id UUID REFERENCES date_ideas(id) NOT NULL,
  status TEXT DEFAULT 'matched',
  planned_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_matches ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
```

### Configuration OpenRouter (optionnel)

1. Créez un compte sur [OpenRouter](https://openrouter.ai)
2. Générez une clé API
3. Ajoutez-la à votre fichier `.env`

## 🏃‍♂️ Lancement

### Démarrer l'application mobile

```bash
# Démarrer le serveur de développement Expo
npm start

# Ou directement sur un appareil/émulateur
npm run android  # Pour Android
npm run ios      # Pour iOS (nécessite macOS)
npm run web      # Pour navigateur web
```

### Démarrer le backend (optionnel)

```bash
cd backend
npm run dev
```

Le backend sera disponible sur `http://localhost:3000`

## 📱 Utilisation

1. **Premier lancement** : Appuyez sur "Start the Quiz"
2. **Authentification** : Inscrivez-vous ou connectez-vous (ou utilisez le mode démo)
3. **Quiz** : Répondez aux 5 questions sur vos préférences
4. **Swipe** : Glissez droite pour liker, gauche pour rejeter les idées de dates
5. **Matches** : Consultez les dates que vous et votre partenaire avez likées

## 🏗️ Architecture

```
YesDateApp/
├── app/
│   ├── components/          # Composants réutilisables
│   │   └── AppNavigator.tsx # Navigation principale
│   ├── screens/            # Écrans de l'application
│   │   ├── WelcomeScreen.tsx
│   │   ├── AuthScreen.tsx
│   │   ├── QuizScreen.tsx
│   │   ├── SwipeDateScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/           # Services API
│   │   └── supabase.ts
│   ├── types/              # Types TypeScript
│   │   └── index.ts
│   └── utils/              # Utilitaires
│       ├── theme.ts
│       └── data.ts
├── backend/                # API backend
│   ├── routes/
│   │   └── dates.ts
│   ├── server.ts
│   └── package.json
├── assets/                 # Images et ressources
└── App.tsx                # Point d'entrée
```

## 🛠️ Technologies Utilisées

### Frontend
- **React Native** avec Expo
- **TypeScript** pour la sécurité des types
- **React Navigation** pour la navigation
- **React Native Gesture Handler** pour les animations de swipe
- **React Native Reanimated** pour les animations fluides
- **Supabase** pour l'authentification et la base de données

### Backend
- **Node.js** avec Express
- **TypeScript**
- **OpenRouter API** pour la génération d'idées par IA

### Services externes
- **Supabase** : Authentification, base de données, temps réel
- **OpenRouter** : API d'IA pour générer des idées de dates
- **Stripe** : Paiements premium (optionnel)

## 🎨 Design

L'application reproduit fidèlement les maquettes Figma avec :
- **Thème cohérent** : Couleurs, typographie, espacements
- **Animations fluides** : Transitions et interactions naturelles
- **Interface intuitive** : Navigation claire et accessible
- **Mode sombre/clair** : Support des préférences utilisateur

## 🔧 Scripts Disponibles

```bash
# Application mobile
npm start          # Démarrer Expo
npm run android    # Lancer sur Android
npm run ios        # Lancer sur iOS
npm run web        # Lancer sur navigateur

# Backend
cd backend
npm run dev        # Mode développement
npm run build      # Compiler TypeScript
npm start          # Lancer en production
```

## 📋 Fonctionnalités à Venir

- [ ] **Stripe Premium** : Abonnement pour plus d'idées
- [ ] **Notifications push** : Rappels et nouveautés
- [ ] **Géolocalisation** : Suggestions basées sur la localisation
- [ ] **Calendrier** : Planification intégrée des dates
- [ ] **Partage social** : Partager vos dates favorites
- [ ] **Chat intégré** : Discussion entre partenaires

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Committez vos changements (`git commit -am 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🔐 Variables d'Environnement Requises

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase | ✅ |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase | ✅ |
| `EXPO_PUBLIC_OPENROUTER_API_KEY` | Clé API OpenRouter | ❌ |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe | ❌ |

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez que toutes les dépendances sont installées
2. Assurez-vous que les variables d'environnement sont configurées
3. Consultez les logs d'erreur dans la console
4. Vérifiez la configuration Supabase

## 🚀 Déploiement

### Application mobile
- **iOS** : Via App Store Connect
- **Android** : Via Google Play Console
- **Web** : Déploiement statique (Netlify, Vercel)

### Backend
- **Heroku** : Déploiement simple
- **Railway** : Alternative moderne
- **DigitalOcean** : Pour plus de contrôle

---

**Créé avec ❤️ pour aider les couples à créer des souvenirs inoubliables**