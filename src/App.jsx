import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CoursePlayer from './pages/CoursePlayer'
import Labs from './pages/Labs'
import LabExperiment from './pages/LabExperiment'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/curso/:id" element={<CoursePlayer />} />
        <Route path="/labs" element={<Labs />} />
        <Route path="/labs/:id" element={<LabExperiment />} />
        <Route path="*" element={<Placeholder />} />
      </Routes>
    </Layout>
  )
}
