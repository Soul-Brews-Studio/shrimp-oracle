import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Home from './pages/Home'

// Layout wrapper for pages that need navbar
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Landing has its own full-screen layout */}
      <Route path="/" element={<Landing />} />
      {/* Other pages use AppLayout */}
      <Route
        path="/home"
        element={
          <AppLayout>
            <Home />
          </AppLayout>
        }
      />
    </Routes>
  )
}
