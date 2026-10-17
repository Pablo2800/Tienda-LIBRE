import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AdminPanel } from './components/AdminPanel.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* El panel del local vive en /admin; el resto es la tienda. */}
    {window.location.pathname.startsWith('/admin') ? <AdminPanel /> : <App />}
  </StrictMode>,
)
