import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/scheherazade-new/400.css'
import '@fontsource/scheherazade-new/700.css'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
