import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { UIFeedbackProvider } from './components/UIFeedback.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UIFeedbackProvider>
      <App />
    </UIFeedbackProvider>
  </StrictMode>,
)

// Registra il service worker: necessario perché le notifiche mostrate tramite
// showNotification() (più affidabili di `new Notification()` su iOS in
// modalità PWA standalone) vengano gestite anche a livello di sistema.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Registrazione service worker fallita:', err);
    });
  });
}
