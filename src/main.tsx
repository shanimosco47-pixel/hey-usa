import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import './styles/animations.css'
import App from './App.tsx'

// How often to ask the browser whether a new service worker was deployed
const SW_UPDATE_INTERVAL_MS = 60 * 60 * 1000

// registerType is 'autoUpdate', so a new worker installs and reloads the page on
// its own — but only once the browser has actually looked for one. It looks on
// page load, and an installed PWA on a phone can sit suspended for days without
// ever reloading, so it keeps serving the build it started with. These checks are
// what make a deploy reach the phone: once an hour, and every time the app is
// brought back to the foreground.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return

    const checkForUpdate = () => {
      if (!navigator.onLine) return
      registration.update().catch(() => {
        // Offline or the request failed — the next check will retry
      })
    }

    setInterval(checkForUpdate, SW_UPDATE_INTERVAL_MS)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
