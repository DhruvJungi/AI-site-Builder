import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from "react-router-dom"
import {AppCOntextProvider} from './context/AppContext'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppCOntextProvider>
      <App />
    </AppCOntextProvider>
  </BrowserRouter>,
)
