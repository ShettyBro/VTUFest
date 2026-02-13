import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { PopupProvider } from './context/PopupContext'

export default function App() {
  return (
    <PopupProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </PopupProvider>
  )
}