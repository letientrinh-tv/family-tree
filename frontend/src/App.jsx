import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import Navbar from './components/Navbar'
import ErrorBoundary from './components/ErrorBoundary'
import FloatingChat from './components/FloatingChat'
import Home from './pages/Home'
import Guide from './pages/Guide'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import TreeEditor from './pages/TreeEditor'
import AdminPanel from './pages/AdminPanel'
import Notifications from './pages/Notifications'
import UpgradePlan from './pages/UpgradePlan'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" style={{ width: '2.5rem', height: '2.5rem' }}></div>
          <p className="text-primary-500 font-serif">Đang tải...</p>
        </div>
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="spinner mx-auto"></div>
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tree/:treeId"
              element={
                <ProtectedRoute>
                  <TreeEditor />
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upgrade"
              element={
                <ProtectedRoute>
                  <UpgradePlan />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <FloatingChat />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FDFAF5',
            color: '#3C2415',
            border: '1px solid #C4A882',
            fontFamily: 'Lora, Georgia, serif',
          },
          success: {
            iconTheme: { primary: '#2D5016', secondary: '#F5F0E8' },
          },
          error: {
            iconTheme: { primary: '#b91c1c', secondary: '#F5F0E8' },
          },
        }}
      />
    </BrowserRouter>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
