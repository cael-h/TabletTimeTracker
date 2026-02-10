import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { FamilyProvider } from './contexts/FamilyContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { TransactionsProvider } from './contexts/TransactionsContext'
import { IdentityProvider } from './contexts/IdentityContext'
import { ChildProvider } from './contexts/ChildContext'
import { ToastProvider } from './components/Toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
      <ThemeProvider>
        <AuthProvider>
          <FamilyProvider>
            <SettingsProvider>
              <TransactionsProvider>
                <IdentityProvider>
                  <ChildProvider>
                    <App />
                  </ChildProvider>
                </IdentityProvider>
              </TransactionsProvider>
            </SettingsProvider>
          </FamilyProvider>
        </AuthProvider>
      </ThemeProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)
