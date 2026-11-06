import { ClerkProvider } from '@clerk/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import { ThemeProvider } from './components/ui/theme/ThemeProvider'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ClerkProvider afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    </ThemeProvider>
  </React.StrictMode>
)
