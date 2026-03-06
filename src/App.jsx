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
            bottom: '8px',
            right: '8px',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.08)',
            textDecoration: 'none',
            zIndex: 999999,
            userSelect: 'none',
            padding: '8px',
          }}>
            Dev by ShettyBro
          </a>
        </BrowserRouter>
      </OnboardingProvider>
    </PopupProvider>
  )
}