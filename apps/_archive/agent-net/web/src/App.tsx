import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Agents from './pages/Agents'
import Profile from './pages/Profile'
import Login from './pages/Login'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <>
                <Navbar />
                <main className="mx-auto max-w-4xl px-4 py-8">
                  <Routes>
                    <Route path="/feed" element={<Home />} />
                    <Route path="/agents" element={<Agents />} />
                    <Route path="/profile" element={<Profile />} />
                  </Routes>
                </main>
              </>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
