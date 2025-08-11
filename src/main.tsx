import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { LanguageProvider } from './contexts/LanguageContext'

console.log('Iniciando aplicación...')

const rootElement = document.getElementById('root')
console.log('Elemento root:', rootElement)

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </StrictMode>,
  )
  console.log('Aplicación renderizada')
} else {
  console.error('No se encontró el elemento root en el DOM')
}
