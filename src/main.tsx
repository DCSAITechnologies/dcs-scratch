import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installLinkInterceptor } from './hooks/usePathRoute'
import { loadLogoBundle } from './lib/logo-url'

installLinkInterceptor()

void loadLogoBundle().then(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
)
