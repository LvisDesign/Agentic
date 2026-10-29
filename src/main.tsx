import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/UI/ErrorBoundary'
import { registerServiceWorker, clearAppBadge } from './utils/pwa'
import { runClientCacheSanitization } from './utils/cacheSanitizer'

// Immediately purge any stale mock data cached in client storage
runClientCacheSanitization();

// Initialize PWA Service Worker & clear stale home-screen badge on app open
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    registerServiceWorker();
    clearAppBadge();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

