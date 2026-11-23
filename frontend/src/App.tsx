import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { useAuth } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import { PageLoader } from '@/components/common'

// Pages
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Generator from '@/pages/Generator'
import ScenarioBuilder from '@/pages/ScenarioBuilder'
import DataLaboratory from '@/pages/DataLaboratory'
import QualityAnalysis from '@/pages/QualityAnalysis'
import ScreeningSimulator from '@/pages/ScreeningSimulator'
import FairnessAnalysis from '@/pages/FairnessAnalysis'
import ReportGenerator from '@/pages/ReportGenerator'
import DatasetHistory from '@/pages/DatasetHistory'
import DatasetDetails from '@/pages/DatasetDetails'
import ApiDocs from '@/pages/ApiDocs'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'
import NotFound from '@/pages/NotFound'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader className="h-[100dvh]" />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** The app opens straight on the sign-in page, or on the overview if already signed in. */
function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader className="h-[100dvh]" />
  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/generate" element={<Generator />} />
        <Route path="/scenarios" element={<ScenarioBuilder />} />
        <Route path="/laboratory" element={<DataLaboratory />} />
        <Route path="/quality" element={<QualityAnalysis />} />
        <Route path="/screening" element={<ScreeningSimulator />} />
        <Route path="/fairness" element={<FairnessAnalysis />} />
        <Route path="/reports" element={<ReportGenerator />} />
        <Route path="/history" element={<DatasetHistory />} />
        <Route path="/datasets/:id" element={<DatasetDetails />} />
        <Route path="/api-docs" element={<ApiDocs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
