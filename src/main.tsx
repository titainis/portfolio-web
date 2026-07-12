import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// A refresh should always replay the zoom-in from the hero, not resume
// wherever the user had scrolled to — the browser's scroll restoration
// fights the cinematic scroll-driven timeline otherwise.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
window.scrollTo(0, 0)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
