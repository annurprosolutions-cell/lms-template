import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SiteSettingsProvider } from './context/SiteSettingsContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <BrowserRouter>
            <SiteSettingsProvider>
                    <AuthProvider>
                              <App />
                                      </AuthProvider>
                                            </SiteSettingsProvider>
                                                </BrowserRouter>
                                                  </React.StrictMode>
                                                  )