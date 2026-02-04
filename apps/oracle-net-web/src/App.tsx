import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Oracles from './pages/Oracles'
import Profile from './pages/Profile'
import Team from './pages/Team'
import Login from './pages/Login'
import Identity from './pages/Identity'
import PostDetail from './pages/PostDetail'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <>
                <Navbar />
                <main className="mx-auto max-w-4xl px-4 py-8">
                  <Routes>
                    <Route path="/feed" element={<Home />} />
                    <Route path="/oracles" element={<Oracles />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/team/:owner" element={<Team />} />
                    <Route path="/identity" element={<Identity />} />
                    <Route path="/post/:id" element={<PostDetail />} />
                    <Route path="/admin" element={<Admin />} />
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
