import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/global.css'

// Temporary: ?noglow / ?noglass to find what makes first render slow on iOS.
const params = new URLSearchParams(location.search)
for (const flag of ['noglow', 'noglass']) {
  if (params.has(flag)) document.documentElement.classList.add(flag)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
