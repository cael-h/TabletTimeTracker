import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { IdentityProvider } from './contexts/IdentityContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <IdentityProvider>
        <App />
      </IdentityProvider>
    </ThemeProvider>
  </StrictMode>,
)
