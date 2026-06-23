# findX - Lost & Found Marketplace

A location-based mobile app for discovering and managing lost and found items. Users can post items they've lost or found, connect with others, and build reputation through reviews and ratings.

## Overview

**findX** is a cross-platform mobile application built with React and Capacitor, designed to help people find lost items or connect with those who have found them. The app features real-time chat, location-based discovery, user ratings, and a leaderboard system.

- **Platform**: iOS & Android (via Capacitor)
- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Mobile Framework**: Capacitor 7
- **Authentication**: Google OAuth 2.0, Phone Verification

## Key Features

### Core Functionality
- **Lost & Found Posts**: Create and browse posts for lost or found items
- **Location-Based Discovery**: Find items near you using Google Maps integration
- **Real-Time Chat**: Direct messaging between users about items
- **User Profiles**: Build reputation through reviews and ratings
- **Favorites System**: Save items for later viewing

### Advanced Features
- **Leaderboard**: Gamification through user rankings
- **Review System**: Rate and review other users
- **Push Notifications**: Stay updated via Firebase Cloud Messaging (FCM)
- **Search & Filter**: Find items by keywords and location
- **Photo Upload**: Share item photos with listings
- **Map View**: Visualize items on an interactive map

### User Management
- **Phone Verification**: Secure phone number verification
- **Profile Setup**: Complete user onboarding flow
- **Settings Page**: Manage preferences and account options
- **Notifications**: View and manage notifications
- **Privacy & Terms**: Accessible legal documentation

## Tech Stack

### Frontend
- **React 19.2.3** - UI framework
- **TypeScript 5.9** - Type safety
- **Vite** - Build tool & dev server
- **React Router 7.9** - Client-side routing
- **Tailwind CSS** - Styling utilities
- **shadcn/ui** - UI component library
- **Lucide React** - Icon library

### Mobile & Native
- **Capacitor 7.4** - Cross-platform mobile framework
- **iOS/Android Integration** - Full native app support

### Services & APIs
- **Firebase** - Authentication & Cloud Messaging (FCM)
- **Google Maps API** - Map integration
- **Google Auth** - OAuth 2.0 authentication
- **WebSocket (STOMP)** - Real-time communication for chat

### Libraries & Utilities
- **React Hook Form** - Form management
- **Date-fns** - Date manipulation
- **Recharts** - Data visualization
- **Motion** - Animation library
- **Sonner** - Toast notifications
- **Emoji Picker** - Emoji selection
- **Embla Carousel** - Carousel component

### Development Tools
- **ESLint** - Code linting
- **Vitest** - Unit testing framework
- **ts-morph** - TypeScript AST manipulation

## Project Structure

```
treasure/
├── src/
│   ├── components/           # React components
│   │   ├── static/          # Static pages (help, terms, privacy, etc.)
│   │   ├── ui/              # Reusable UI components
│   │   ├── figma/           # Design-related components
│   │   └── *.tsx            # Page components
│   ├── styles/              # Global & component styles
│   ├── utils/               # Utility functions
│   │   ├── auth.ts          # Authentication helpers
│   │   └── theme.tsx        # Theme provider
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Main app component with routing
│   ├── main.tsx             # React entry point
│   ├── firebase.ts          # Firebase configuration
│   ├── config.ts            # App configuration
│   └── vite-env.d.ts        # Vite environment types
├── ios/                     # iOS native code
├── android/                 # Android native code (if generated)
├── capacitor.config.ts      # Capacitor configuration
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## Getting Started

### Prerequisites
- **Node.js** >= 16
- **npm** or **yarn**
- **Xcode** (for iOS development)
- **Android Studio** (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd treasure
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the project root:
   ```env
   VITE_API_URL=https://treasurehunter.seohamin.com/api/v1
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

## Available Scripts

- **`npm run dev`** - Start Vite dev server with host access
- **`npm run build`** - Build TypeScript and bundle with Vite
- **`npm run lint`** - Run ESLint to check code quality
- **`npm run preview`** - Preview production build locally

## Development Workflow

### Web Development
The app runs as a web app during development, allowing rapid iteration:
```bash
npm run dev
# Open http://localhost:5173 in browser
```

### Mobile Development

#### iOS
```bash
# Sync web assets to iOS project
npx cap sync ios

# Open in Xcode
npx cap open ios

# Build and run from Xcode
```

#### Android
```bash
# Sync web assets to Android project
npx cap sync android

# Open in Android Studio
npx cap open android

# Build and run from Android Studio
```

## Authentication Flow

1. **Onboarding Page** - First-time users see app introduction
2. **Login/Signup** - OAuth 2.0 with Google or phone/email signup
3. **Phone Verification** - SMS-based phone verification (for email signup)
4. **Profile Setup** - Complete user profile (optional for OAuth users)
5. **Home Screen** - Main app interface with item feed

## Key Routes

| Path | Purpose |
|------|---------|
| `/` | Root redirect (auth check) |
| `/onboarding` | First-time user introduction |
| `/login` | Login page |
| `/signup` | Sign up page |
| `/home` | Main feed (protected) |
| `/items/:id` | Item detail view |
| `/create` | Create new post |
| `/map` | Map view of items |
| `/chat/:id` | Chat with user |
| `/profile` | User profile |
| `/my-items` | User's posted items |
| `/search` | Search & filter items |
| `/favorites` | Saved items |
| `/settings` | User settings |
| `/leaderboard` | User rankings |
| `/reviews` | User reviews |

## Configuration

### Firebase (FCM - Push Notifications)
- Firebase project must be configured in `src/App.tsx`
- Push notifications are platform-specific (iOS APNs, Android FCM)
- Tokens are sent to backend for delivery

### Google Authentication
- OAuth credentials configured in `capacitor.config.ts`
- Separate Client IDs for:
  - Web platform
  - iOS
  - Android

### API Base URL
- Default: `https://treasurehunter.seohamin.com/api/v1`
- Override via `VITE_API_URL` environment variable

## State Management

- **React Router** - Client-side routing
- **React Hooks** - Component state management
- **Context API** - Global state (Chat context)
- **localStorage** - Persistent state (tokens, onboarding status)

## Styling

- **Tailwind CSS** - Utility-first CSS
- **CSS Modules/Global Styles** - Component-specific styles in `/src/styles/`
- **Dark Mode Support** - Theme provider in `/src/utils/theme.tsx`

## Contributing

When making changes, follow these guidelines:
- Use TypeScript for type safety
- Follow existing component patterns
- Test on both iOS and Android
- Keep components focused and reusable
- Update styles in component CSS files

## Deployment

### Web
1. Run `npm run build` to create optimized bundle
2. Deploy `dist/` folder to web hosting

### Mobile Apps
1. Build web bundle: `npm run build`
2. Sync to mobile: `npx cap sync [ios|android]`
3. Build and submit from Xcode (iOS) or Android Studio (Android)

## Troubleshooting

### Common Issues

**FCM Token Not Received**
- Ensure Firebase is properly configured
- Check platform-specific permissions (iOS/Android)
- Verify APNs certificate (iOS) or FCM credentials (Android)

**Authentication Failures**
- Verify API base URL in config
- Check token storage (localStorage)
- Ensure Origin header matches server configuration

**Map Not Loading**
- Verify Google Maps API key
- Check geolocation permissions
- Confirm location services are enabled

## License

[Include your license information]

## Support

For issues or questions:
- Check existing issues on the repository
- Review the Help page in the app (`/help`)
- Contact the development team

---

**Version**: 0.0.0  
**Last Updated**: June 2026  
**Status**: Active Development
