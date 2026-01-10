# Tablet Time Tracker

A mobile-first Progressive Web App (PWA) for tracking your child's earned and spent screen-time minutes. Built for families to share real-time updates across devices.

## Features

- **Family Groups**: Create or join a family group with a unique 6-character code
- **Role-Based System**: Parents and kids have different permissions and tracking
  - **Parents**: Earn points instead of minutes, approve time requests, and manage family members
  - **Kids**: Earn and spend tablet time minutes (adding time requires parent approval)
- **Approval Workflow**: Kids can request additional tablet time, which parents can approve or reject
- **Real-time Sync**: Updates instantly across all family members' devices
- **Offline Support**: Continue logging transactions even without internet; syncs when connection returns
- **Dark Mode**: Choose between Light, Dark, or System theme
- **Mobile-First**: Optimized for touch screens with large tap targets
- **PWA**: Installable on mobile devices for a native app experience
- **Simple & Fast**: Log rewards and redemptions in seconds
- **Share & Invite**: Easily invite family members via text, email, or share link

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
    // Helper function to check if user is a member of a family
    function isFamilyMember(familyId) {
      return request.auth != null &&
             exists(/databases/$(database)/documents/families/$(familyId)) &&
             get(/databases/$(database)/documents/families/$(familyId)).data.members[request.auth.uid] != null;
    }

    // Helper function to check if user is an approved parent in a family
    function isApprovedParent(familyId) {
      return request.auth != null &&
             exists(/databases/$(database)/documents/families/$(familyId)) &&
             get(/databases/$(database)/documents/families/$(familyId)).data.members[request.auth.uid].role == 'parent' &&
             get(/databases/$(database)/documents/families/$(familyId)).data.members[request.auth.uid].status == 'approved';
    }

    // Family documents - anyone can read to check if a family code exists (for joining)
    // Only family members can update (to add themselves)
    match /families/{familyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        isFamilyMember(familyId) ||
        // Allow users to add themselves as a new member
        request.resource.data.members[request.auth.uid] != null
      );
      allow delete: if isApprovedParent(familyId);

      // Family settings - all family members can read, only approved parents can write
      match /settings/{document} {
        allow read: if isFamilyMember(familyId);
        allow write: if isApprovedParent(familyId);
      }

      // Family transactions - all family members can read and create
      // Only approved parents can delete or update status
      match /transactions/{transactionId} {
        allow read: if isFamilyMember(familyId);
        allow create: if isFamilyMember(familyId);
        allow delete: if isApprovedParent(familyId);
        allow update: if isApprovedParent(familyId);
      }
    }

    // User documents - for storing user's familyId
    match /users/{userId} {
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

1. **Sign Up**: Create an account using email and password or sign in with Google
2. **Family Setup**: Choose to either:
   - **Join Existing Family**: Enter the 6-character family code shared by another family member
   - **Create New Family**: Set a family name and create a new family group
3. **Select Role**: Choose whether you're a Parent or Kid
   - If joining as a Parent, existing parents will need to approve your request
   - Kids are automatically approved when they join
4. **Select Identity**: Choose whether you're "Mom", "Dad", or enter a custom name
5. **Select/Add People**: Choose or add the person you're tracking time for
6. **Start Tracking**: Begin logging earned and spent minutes or points!

### Daily Use

#### Adding Activity (Rewards, Chores, Adjustments)
1. Go to the "Add" tab
2. Select a category (Reward, Chore, or Adjustment)
3. Choose unit type (Minutes for kids, Points for parents)
4. Choose an amount (3m, 5m, 10m, etc.)
5. Select or enter a reason (e.g., "Brushed Teeth", "Cleaned Room")
6. Tap "Add X minutes/points"
   - **For Kids**: Adding time sends a request to parents for approval
   - **For Parents**: All activities are auto-approved

#### Spending Minutes (Redemptions)
1. Go to the "Add" tab
2. Select "Redemption" category
3. Choose an amount
4. Select or enter a reason (e.g., "Tablet", "TV")
5. Tap "Subtract X minutes"
   - Kids can remove time without approval (logging usage)

#### Approvals (Parents Only)
- Go to the "Approvals" tab to see:
  - Pending parent requests (new parents joining the family)
  - Pending time requests (kids requesting more tablet time)
- Tap "Approve" or "Reject" for each request
- Badge shows number of pending requests

#### Viewing History
- Go to the "History" tab to see all transactions grouped by day
- Status badges show if transactions are Pending or Rejected
- Delete transactions (parents only)
- See daily subtotals and running balance

#### Family Management (Settings)
- View family name and code
- Share invite link to add family members (text, email, or copy code)
- See all family members with their roles and status
- Manage reward, redemption, and chore reasons
- Customize person colors
- Change your identity (Mom/Dad/Custom)
- Toggle dark mode
- Reset balance to 0
- Sign out

## Data Model

### Family Groups
- `id`: 6-character alphanumeric family code
- `name`: Family name
- `createdAt`: When the family was created
- `createdBy`: User ID of the creator
- `members`: Map of user IDs to member information
  - `name`: Member's display name
  - `email`: Member's email address
  - `role`: "parent" or "kid"
  - `status`: "approved", "pending", or "rejected"
  - `joinedAt`: When they joined
  - `approvedBy`: User ID of approving parent (for parent requests)
  - `childId`: Linked child profile (for kids)

### Transactions
Each transaction has:
- `timestamp`: When the transaction occurred
- `amount`: Positive = earned, negative = spent
- `reason`: Why the minutes/points were earned/spent
- `category`: "Reward", "Redemption", "Chore", or "Adjustment"
- `user`: Display name of who logged it (Mom, Dad, custom name)
- `userId`: Firebase Auth user ID of who logged it
- `childId`: Which child/person this is for
- `unit`: "minutes" (for kids) or "points" (for parents)
- `status`: "approved", "pending", or "rejected"
- `approvedBy`: User ID of approving parent (if applicable)
- `approvedAt`: When it was approved/rejected

### Settings (per family)
- `rewardReasons`: Array of preset reward reasons
- `redemptionReasons`: Array of preset redemption reasons
- `choreReasons`: Array of preset chore reasons
- `children`: Array of child/person profiles
  - `name`: Person's name
  - `createdAt`: When added
  - `color`: Display color (hex code)
  - `email`: Optional email for linking auth account

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
