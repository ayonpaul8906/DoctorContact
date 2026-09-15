# Dewasi Group Mobile Application

React Native + Expo mobile client for the Dewasi Group healthcare and queue management platform.

---

## 📱 Tech Stack

- **Framework**: React Native with Expo (Managed Workflow)
- **Routing**: Expo Router (File-based navigation)
- **Language**: TypeScript
- **Networking**: Axios with centralized token management & refresh interceptors
- **Server State**: TanStack React Query v5
- **Secure Storage**: Expo SecureStore
- **Realtime**: Socket.IO Client
- **Design Tokens**: Single-source-of-truth tokens mirroring Web application (`globals.css`)

---

## 📂 Project Structure

```
apps/mobile/
├── app/                  # Expo Router navigation routes
│   ├── _layout.tsx       # Root layout (SafeArea, QueryClient, AuthProvider, Stack)
│   ├── index.tsx         # Launch & routing entry
│   ├── (auth)/           # Authentication route group
│   │   └── index.tsx     # Auth placeholder screen
│   └── (main)/           # Main application route group
│       └── index.tsx     # Main application placeholder screen
│
├── api/                  # API client exports
├── components/           # Reusable mobile UI components
├── hooks/                # Custom React Native hooks
├── lib/                  # Core abstractions (API, Auth, Config, Query, SecureStore, Socket)
├── store/                # Persistent storage helpers
├── theme/                # Design tokens (Colors, Spacing, Radius, Typography, Shadows)
├── types/                # Domain models & TypeScript definitions
├── utils/                # Utility helpers
│
├── app.json              # Expo application configuration
├── babel.config.js       # Babel configuration
├── metro.config.js       # Metro bundler monorepo configuration
├── package.json          # Mobile dependencies & scripts
├── tsconfig.json         # TypeScript configuration
├── mobile-design-reference.md # Web -> Mobile design system documentation
└── README.md             # This document
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Mobile Development Server
```bash
# From apps/mobile directory:
npx expo start

# Or for specific platforms:
npx expo start --android
npx expo start --ios
```

### 3. Type Checking
```bash
npm run type-check --workspace=mobile
# Or inside apps/mobile:
npx tsc --noEmit
```

---

## 🔒 Architecture Rules

1. **Backend is Locked**: The mobile application strictly consumes existing backend endpoints.
2. **Web App is Reference**: Visual design, color palette, and data contracts strictly mirror the Web application.
3. **Monorepo Isolation**: All mobile-specific code resides exclusively within `apps/mobile/`.
