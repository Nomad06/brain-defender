import React from 'react'
import ReactDOM from 'react-dom/client'
import BlockedPage from './BlockedPage'
import { initializeTheme } from '../../shared/themes'

// Initialize theme before rendering
initializeTheme().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BlockedPage />
    </React.StrictMode>
  )
})
