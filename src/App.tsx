import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { VerificationSuccess } from './pages/VerificationSuccess';
import { Stories } from './pages/Stories';
import { StoryRead } from './pages/StoryRead';
import { Write } from './pages/Write';
import { Dashboard } from './pages/Dashboard';
import { AccountSettings } from './pages/AccountSettings';
import { Notifications } from './pages/Notifications';
import { Chat } from './pages/Chat';
import { Search } from './pages/Search';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 border',
                duration: 4000,
              }}
            />
            <ErrorBoundary>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/verification-success" element={<VerificationSuccess />} />
                  
                  {/* Public Feed Route */}
                  <Route path="/stories" element={<Stories />} />
                  
                  {/* Protected Routes */}
                  <Route
                    path="/stories/:id"
                    element={
                      <ProtectedRoute>
                        <StoryRead />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/write"
                    element={
                      <ProtectedRoute>
                        <Write />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile/:username"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <AccountSettings />
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
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/search"
                    element={
                      <ProtectedRoute>
                        <Search />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfaf7] dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 font-sans">
                        <h1 className="text-8xl font-black tracking-tighter text-indigo-650 dark:text-indigo-400">404</h1>
                        <h2 className="text-xl font-bold uppercase tracking-wider mt-4">Page Not Found</h2>
                        <p className="text-sm text-slate-500 font-serif mt-2 italic">Every story must have an ending, but this path doesn't exist.</p>
                        <Link
                          to="/"
                          className="mt-6 px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-950 rounded-full font-bold text-xs uppercase tracking-widest shadow-md"
                        >
                          Return to Landing
                        </Link>
                      </div>
                    }
                  />
                </Routes>
              </BrowserRouter>
            </ErrorBoundary>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// We need Link for 404 block so import it from react-router-dom
import { Link } from 'react-router-dom';

export default App;
