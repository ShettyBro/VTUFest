import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { PopupProvider } from './context/PopupContext'
import { OnboardingProvider } from './context/OnboardingContext'

export default function App() {
  return (
    <PopupProvider>
      <OnboardingProvider>
        <BrowserRouter>
          <AppRoutes />
          <a href="https://sudeepbro.works/" target="_blank" rel="noopener noreferrer" style={{
            position: 'fixed',
            bottom: '4px',
            right: '4px',
            fontSize: '5px',
            color: 'rgba(255,255,255,0.08)',
            textDecoration: 'none',
            zIndex: 999999,
            userSelect: 'none',
            padding: '8px',
          }}>
            ShettyBro
          </a>
        </BrowserRouter>
      </OnboardingProvider>
    </PopupProvider>
  )
}