import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker, clearAppBadge } from './utils/pwa'

// Initialize PWA Service Worker & clear stale home-screen badge on app open
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    registerServiceWorker();
    clearAppBadge();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

