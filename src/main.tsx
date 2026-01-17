import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { IdentityProvider } from './contexts/IdentityContext'
import { ChildProvider } from './contexts/ChildContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <IdentityProvider>
          <ChildProvider>
            <App />
          </ChildProvider>
        </IdentityProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
