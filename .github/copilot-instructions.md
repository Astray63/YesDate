# YesDate App - AI Coding Assistant Instructions

## Project Overview
YesDate is a React Native/Expo dating app for couples to discover personalized date ideas through AI-powered recommendations and Tinder-like swiping. The app uses Supabase for backend services and features quiz-based matching, gamification, and community inspiration.

**Tech Stack**: Expo SDK 54.0.0, React Native with Hermes engine, TypeScript strict mode

## Architecture & Structure

### Core Navigation Pattern
- **Stack Navigator** (`AppNavigator.tsx`) handles auth flow: Welcome → Auth → Quiz → Main tabs
- **Tab Navigator** within Main contains: Home, SwipeDate, Match, Community, Profile
- All screens are in `app/screens/` and follow the naming pattern `[Feature]Screen.tsx`

### Service Layer Architecture
- **Supabase Service** (`app/services/supabase.ts`) provides centralized auth and data operations
- All database operations use the exported `supabase` client and structured service functions
- Auth flow uses `authService` object with methods like `signUp()`, `signIn()`, `joinPartner()`

### Type System Conventions
- All interfaces are centralized in `app/types/index.ts`
- Navigation props use `NavigationProps` interface with `navigation` and optional `route`
- Database entities follow camelCase (TypeScript) vs snake_case (Supabase) convention
- Core entities: `User`, `DateIdea`, `DateSwipe`, `DateMatch`, `QuizQuestion`

## Development Workflows

### Environment Setup
```bash
# Main app development
npm start                    # Start Expo dev server
npm run android/ios/web     # Platform-specific builds

# Backend development  
cd backend && npm run dev   # TypeScript backend with ts-node
```

### App Configuration (app.json)
- **Entry point**: `index.ts` (not App.js)
- **Expo SDK**: 54.0.0 with new architecture enabled
- **Platforms**: iOS, Android, Web support
- **Assets**: Icon, splash screen, adaptive icon configured
- **Bundle**: Hermes engine with bytecode transformation

### Database Schema (Supabase)
- **Tables**: `profiles`, `quiz_responses`, `date_ideas`, `date_swipes`, `date_matches`
- **RLS enabled** on all tables with user-scoped policies
- **Partner linking**: Users connected via `partner_id` and `invitation_code` system

## Project-Specific Patterns

### Theme System
- Centralized design tokens in `app/utils/theme.ts`
- Structured color system: `primary`, `backgroundLight/Dark`, `textLight/Dark`, `borderLight/Dark`
- Consistent spacing, typography, and shadow definitions
- Use `theme.colors.primary` (#f04299) for brand consistency

### Animation Patterns (Swipe Cards)
```typescript
// Standard swipe implementation pattern in SwipeDateScreen
const translateX = useRef(new Animated.Value(0)).current;
const rotate = useRef(new Animated.Value(0)).current;
// Use PanGestureHandler with threshold-based actions
```

### Data Management
- **Sample data** in `app/utils/data.ts` for development/testing
- **Quiz structure**: 5 questions with emoji-based options covering mood, activity, location, budget, duration
- **Date ideas**: Structured with title, description, image_url, duration, category, difficulty, cost

### Screen Patterns
- All screens extend `NavigationProps` interface
- Screens use `SafeAreaView` wrapper with `theme.colors.backgroundLight`
- Modal screens (like Gamification) use `presentation: 'modal'` in navigator options

## Integration Points

### Supabase Integration
- Environment variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Real-time subscriptions for partner matching
- Row Level Security (RLS) policies enforce user data isolation

### AI Integration (OpenRouter)
- Environment variable: `EXPO_PUBLIC_OPENROUTER_API_KEY`
- Backend API at `/backend/routes/dates.ts` handles AI date generation
- Frontend calls backend API, not directly to OpenRouter

### State Management
- Uses React hooks (useState, useRef) - no external state management
- Auth state managed through Supabase's built-in auth state changes
- Local component state for UI interactions (swipes, quiz responses)

## Code Style Guidelines

### File Organization
- Components in `app/components/`
- Screens in `app/screens/` 
- Services in `app/services/`
- Types in `app/types/`
- Utilities in `app/utils/`
- Backend separate in `backend/`

### Naming Conventions
- React components: PascalCase with descriptive suffixes (`SwipeDateScreen`, `AppNavigator`)
- Functions: camelCase with action verbs (`signUp`, `generateInvitationCode`)
- Constants: camelCase for objects, UPPER_CASE for primitives
- Database fields: snake_case (Supabase convention)

### TypeScript Usage
- Strict mode enabled in `tsconfig.json`
- All screens typed with proper navigation props
- Interface definitions for all data structures
- Explicit return types for service functions

## Debugging & Testing

### Common Issues
- **Expo environment variables**: Must start with `EXPO_PUBLIC_` prefix
- **Navigation typing**: Use `NavigationProps` interface for proper TypeSafety
- **Supabase RLS**: Ensure user context in database queries
- **Gesture handlers**: Import from `react-native-gesture-handler`, not core React Native
- **Entry point**: App uses `index.ts`, not `App.js` - important for metro bundler
- **Hermes engine**: Bytecode transformation enabled for optimized performance
- **Nested navigation**: To navigate from Stack to Tab screens, use `navigation.navigate('Main', { screen: 'TabName' })`

### Development Commands
```bash
# Clear Expo cache if issues arise
npx expo start --clear

# Backend TypeScript compilation
cd backend && npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

When working on this codebase, prioritize understanding the quiz → swipe → match flow, maintain the established theme system, and ensure proper TypeScript typing throughout.