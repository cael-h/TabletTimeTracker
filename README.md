# Tablet Time Tracker

A mobile-first Progressive Web App (PWA) for tracking your child's earned and spent screen-time minutes. Built for families to share real-time updates across devices.

## Features

- **Real-time Sync**: Updates instantly across all devices when Mom or Dad logs minutes
- **Offline Support**: Continue logging transactions even without internet; syncs when connection returns
- **Dark Mode**: Choose between Light, Dark, or System theme
- **Mobile-First**: Optimized for touch screens with large tap targets
- **PWA**: Installable on mobile devices for a native app experience
- **Simple & Fast**: Log 3m or 5m rewards in under 10 seconds

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore + Authentication)
- **PWA**: vite-plugin-pwa with Workbox
- **Icons**: Lucide React
- **Date Utilities**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Firebase project (see setup instructions below)

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Authentication**:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password" provider
4. Enable **Firestore Database**:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see below)
5. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll down to "Your apps" and click the web icon `</>`
   - Copy the configuration values

### Firestore Security Rules

Add these security rules in Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd TabletTimeTracker
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Firebase configuration values:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
npm run build
npm run preview  # Preview the production build
```

## Usage

### First Time Setup

1. **Sign Up**: Create an account using email and password
2. **Select Identity**: Choose whether you're "Mom" or "Dad"
3. **Start Tracking**: Begin logging earned and spent minutes!

### Daily Use

#### Earning Minutes (Rewards)
1. Go to the "Add" tab
2. Select "Earn" mode
3. Choose an amount (3m, 5m, 10m, etc.)
4. Select or enter a reason (e.g., "Brushed Teeth")
5. Tap "Add X minutes"

#### Spending Minutes (Redemptions)
1. Go to the "Add" tab
2. Select "Spend" mode
3. Choose an amount
4. Select or enter a reason (e.g., "Tablet", "TV")
5. Tap "Subtract X minutes"

#### Viewing History
- Go to the "History" tab to see all transactions grouped by day
- Long-press or swipe to delete a transaction
- See daily subtotals and running balance

#### Settings
- Manage reward and redemption reasons
- Change your identity (Mom/Dad)
- Toggle dark mode
- Reset balance to 0
- Sign out

## Data Model

### Transactions
Each transaction has:
- `timestamp`: When the transaction occurred
- `amount`: Minutes (positive = earned, negative = spent)
- `reason`: Why the minutes were earned/spent
- `category`: "Reward", "Redemption", or "Adjustment"
- `user`: "Mom" or "Dad"

### Settings
- `rewardReasons`: Array of preset reward reasons
- `redemptionReasons`: Array of preset redemption reasons

## PWA Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Install app" or "Add to Home Screen"
4. Tap "Install"

## Development

### Project Structure
```
src/
├── components/       # Reusable UI components
├── config/          # Firebase configuration
├── contexts/        # React contexts (Theme, Identity)
├── hooks/           # Custom React hooks
├── pages/           # Main app pages
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

### Key Files
- `src/config/firebase.ts`: Firebase initialization
- `src/hooks/useTransactions.ts`: Transaction management with real-time updates
- `src/hooks/useSettings.ts`: Settings management
- `src/contexts/ThemeContext.tsx`: Dark mode support
- `vite.config.ts`: PWA configuration

## Troubleshooting

### App not syncing between devices
- Check that both devices are signed in with the same account
- Verify internet connection
- Check Firebase Console for any errors

### Offline mode not working
- Make sure you've enabled Firestore offline persistence
- Check browser compatibility (IndexedDB support required)

### PWA not installing
- Ensure the app is served over HTTPS (required for PWA)
- Check browser console for manifest or service worker errors

## Contributing

This is a personal family project, but feel free to fork and customize for your own use!

## License

MIT
