import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../../styles.css'
import { initializeTheme } from '../shared/themes'

// Initialize theme before rendering
initializeTheme().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
