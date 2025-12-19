// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '././styles/globals.css'
import App from './App.tsx'
import "../src/firebase.ts"

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <App />
  // </StrictMode>,
)
