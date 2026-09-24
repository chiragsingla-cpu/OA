import { Navigate, Route, Routes } from 'react-router-dom'
import { homePathFor, useAuth } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import AdminDashboard from './pages/AdminDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import Login from './pages/Login'
import Register from './pages/Register'

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  return <Navigate to={user ? homePathFor(user) : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
