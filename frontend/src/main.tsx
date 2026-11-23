import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: '#25222b',
          color: '#f8f3f1',
          fontSize: '13px',
          borderRadius: '6px',
          padding: '8px 12px',
        },
        success: { iconTheme: { primary: '#8fc0a5', secondary: '#25222b' } },
        error: { iconTheme: { primary: '#e08b7a', secondary: '#25222b' } },
      }}
    />
  </React.StrictMode>,
)
