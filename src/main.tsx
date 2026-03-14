import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import './styles/animations.css'
import App from './App.tsx'

// Auto-reload when new SW is available
registerSW({
  onNeedRefresh() {
    // Automatically reload — no prompt needed for a family app
    window.location.reload()
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
