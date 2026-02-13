import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import InstallPrompt from './components/InstallPrompt'
import Home from './pages/Home'
import CreatePoll from './pages/CreatePoll'
import Vote from './pages/Vote'
import Results from './pages/Results'
import History from './pages/History'
import Analytics from './pages/Analytics'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import RedirectIfAuthenticated from './components/RedirectIfAuthenticated'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <InstallPrompt />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreatePoll />} />
            <Route path="/vote" element={<Vote />} />
            <Route path="/results/:pollId" element={<Results />} />
            <Route path="/history" element={<History />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
            <Route path="/signup" element={<RedirectIfAuthenticated><Signup /></RedirectIfAuthenticated>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
