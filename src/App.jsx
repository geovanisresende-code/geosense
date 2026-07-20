import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CoursePlayer from './pages/CoursePlayer'
import Labs from './pages/Labs'
import LabExperiment from './pages/LabExperiment'
import CalendarPage from './pages/CalendarPage'
import LibraryPage from './pages/LibraryPage'
import Placeholder from './pages/Placeholder'
import Admin from './pages/admin/Admin'

function RequireAuth({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

function RequireAdmin({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function StudentApp() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/curso/:id" element={<CoursePlayer />} />
        <Route path="/labs" element={<Labs />} />
        <Route path="/labs/:id" element={<LabExperiment />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/biblioteca" element={<LibraryPage />} />
        <Route path="*" element={<Placeholder />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
      <Route path="/*" element={<RequireAuth><StudentApp /></RequireAuth>} />
    </Routes>
  )
}
