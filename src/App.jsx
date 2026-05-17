import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { PopupProvider } from './context/PopupContext'
import { OnboardingProvider } from './context/OnboardingContext'
import Footer from './components/layout/Footer'

export default function App() {
  return (
    <PopupProvider>
      <OnboardingProvider>
        <BrowserRouter>
          <AppRoutes />
          <Footer />
        </BrowserRouter>
      </OnboardingProvider>
    </PopupProvider>
  )
}