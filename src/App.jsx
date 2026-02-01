import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
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

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreatePoll />} />
            <Route path="/vote" element={<Vote />} />
            <Route path="/results/:pollId" element={<Results />} />
            <Route path="/history" element={<History />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
