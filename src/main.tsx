import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// PWA registration temporarily disabled to kill old service worker
// import { registerSW } from 'virtual:pwa-register'
import './index.css'
import './styles/animations.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
