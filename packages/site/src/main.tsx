import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import "./globals.css"
import {ApiProvider} from "./api.tsx"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApiProvider>
        <App />
    </ApiProvider>
  </React.StrictMode>,
)
