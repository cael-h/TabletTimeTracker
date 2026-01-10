# Development Notes - Tablet Time Tracker

## 📋 Project Overview
Family-focused Progressive Web App (PWA) for tracking screen time and chores with real-time Firebase sync.

**Stack:**
- Frontend: React 19 + TypeScript + Vite
- Backend: Firebase (Firestore + Authentication)
- Styling: Tailwind CSS
- PWA: vite-plugin-pwa with Workbox
- Deployment: Firebase Hosting

## 🆕 Recent Changes (Jan 2026)

### Major Features Added
1. **Chores Tracking System**
   - Added 'Chore' category alongside Reward/Redemption/Adjustment
   - Configurable chore reasons in Settings (Dishes, Laundry, etc.)
   - Blue color coding for chore transactions

2. **Points System**
   - Toggle between "Minutes" and "Points" units
   - Minutes for kids' screen time, Points for adult accomplishments
   - Display: "5 pts" vs "5m" or "1h 30m"

3. **Color-Coded Person Display**
   - Each person can have a custom color
   - Colors shown in History and Dashboard
   - Color picker in Settings page
   - Helps quickly identify who did what

### Technical Changes
- Updated `Transaction` type: added `unit: 'minutes' | 'points'` and `'Chore'` category
- Updated `Child` type: added optional `color?: string` field
- Updated `Settings`: added `choreReasons: string[]`
- Modified pages: AddTransactionPage, HistoryPage, DashboardPage, SettingsPage
- Added `updateChildColor()` function to useSettings hook
- Backward compatible: defaults to 'minutes' for old transactions

### Latest Commit
```
5f2c522 - Add chores tracking and points system with color-coded person display
```

## 🔧 Development Environment

### Important: Cloud Container vs Local Termux
**Claude works in a cloud sandbox container**, NOT directly on your Termux device:
- Cloud container syncs with GitHub repository
- Changes pushed to GitHub are available on your local Termux
- Your local Termux may have uncommitted changes (like `package-lock.json`)
- Environment: gVisor container (runsc) on Linux, running as root

### Git Workflow
**Current Branch:** `claude/fix-connection-loop-3XhRB`

**Common Commands:**
```bash
# Checkout local branch (correct)
git checkout claude/fix-connection-loop-3XhRB

# NOT this (creates confusion)
git checkout origin/claude/fix-connection-loop-3XhRB  # ❌ Wrong!

# Create and checkout new branch
git checkout -b feature/new-feature

# Fix local package-lock.json issues
git checkout -- package-lock.json
```

**Branch Naming Convention:**
- Branches should start with `claude/` and end with session ID
- Example: `claude/fix-connection-loop-3XhRB`
- Required for push permissions (403 error otherwise)

**Push with Retry Logic:**
```bash
# Always use -u flag for first push
git push -u origin branch-name

# Retry on network errors (up to 4 times with exponential backoff: 2s, 4s, 8s, 16s)
```

## 🚀 Build & Deployment

### Build
```bash
npm run build
# Output: dist/ directory
# Build includes TypeScript compilation + Vite bundling + PWA generation
```

### Firebase Deployment
```bash
# First-time login (on local Termux)
firebase login --no-localhost

# Deploy (after authentication)
firebase deploy

# Preview locally
npm run preview
```

### Cache Issues After Deploy
If changes don't appear after deployment:
1. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. Clear service worker: DevTools → Application → Service Workers → Unregister
3. Clear site data: DevTools → Application → Clear storage → Clear site data

## 📁 Key Files & Structure

### Core Files
```
src/
├── types/index.ts              # TypeScript type definitions
├── config/firebase.ts          # Firebase initialization
├── hooks/
│   ├── useAuth.ts             # Authentication (email, Google)
│   ├── useTransactions.ts     # Transaction CRUD + real-time sync
│   └── useSettings.ts         # Settings & child management + color picker
├── contexts/
│   ├── IdentityContext.tsx    # Mom/Dad/Custom name state
│   ├── ChildContext.tsx       # Active child selection
│   └── ThemeContext.tsx       # Light/Dark/System theme
└── pages/
    ├── AddTransactionPage.tsx # Category + Unit + Amount selection
    ├── HistoryPage.tsx        # Transactions with colored person names
    ├── DashboardPage.tsx      # Balance + recent activity
    ├── SettingsPage.tsx       # Chore reasons + color picker
    ├── AuthPage.tsx           # Email/Google authentication
    ├── IdentitySelectPage.tsx # Mom/Dad/Custom identity
    └── ChildSelectPage.tsx    # Child selection & management
```

### Important Type Definitions
```typescript
// Transaction with units and chores
type TransactionCategory = 'Reward' | 'Redemption' | 'Adjustment' | 'Chore';
type TransactionUnit = 'minutes' | 'points';

interface Transaction {
  id: string;
  timestamp: Date;
  amount: number;
  reason: string;
  category: TransactionCategory;
  user: string;
  childId: string;
  unit: TransactionUnit; // NEW
}

// Child/Person with colors
interface Child {
  id: string;
  name: string;
  createdAt: Date;
  color?: string; // NEW - Hex color code
}

// Settings with chore reasons
interface Settings {
  id: string;
  rewardReasons: string[];
  redemptionReasons: string[];
  choreReasons: string[]; // NEW
  children: Child[];
}
```

## 🐛 Known Issues & Solutions

### Package Lock Issues
If you get `package-lock.json` conflicts when switching branches:
```bash
git checkout -- package-lock.json
```

### Firebase Authentication
- CLI requires `firebase login --no-localhost` on Termux
- Non-interactive environment needs CI token: `firebase login:ci`

### Build Warnings
- Large chunk size warning (676 kB) - consider code splitting if needed
- Safe to ignore for current scale

## 💡 Tips for Future Claude Sessions

1. **Always check current branch first:**
   ```bash
   git branch --show-current
   ```

2. **Remember the environment:**
   - Claude works in cloud container
   - Syncs via GitHub
   - Local Termux may have uncommitted changes

3. **Before making changes:**
   - Read files first using Read tool
   - Check recent commits: `git log --oneline -5`
   - Verify working directory is clean: `git status`

4. **Testing new features:**
   - Build first: `npm run build`
   - Check for TypeScript errors
   - Test locally: `npm run preview`
   - Deploy: `firebase deploy` (after user authentication)

5. **Color features:**
   - Colors stored as hex codes (e.g., '#6b7280')
   - Default gray if no color set
   - Applied via inline styles in React components

## 📝 Notes
- Last updated: January 10, 2026
- Firebase project: tablettimetracker
- Main deployment URL: (check firebase.json for hosting config)
- Session branch: `claude/fix-connection-loop-3XhRB`
