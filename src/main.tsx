import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { Settings } from './pages/Settings'
import { SettingsProvider } from './contexts/SettingsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  </StrictMode>,
)
