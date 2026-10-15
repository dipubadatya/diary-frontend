import { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { NavigationProvider } from "./contexts/NavigationContext";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/auth/Login";
import { SignUp } from "./pages/auth/SignUp";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { VerifyEmail } from "./pages/auth/VerifyEmail";
import { VerificationSuccess } from "./pages/auth/EmailVerificationSuccess";
import { Stories } from "./pages/stories/Stories";
import { StoryRead } from "./pages/stories/StoryRead";
import { Write } from "./pages/stories/WriteStory";
import { Profile } from "./pages/profile/Profile";
import { AccountSettings } from "./pages/profile/AccountSettings";
import { Notifications } from "./pages/notifications/Notifications";
import { Chat } from "./pages/chat/Chat";
import { Search } from "./pages/search/Search";
import { DiaryCalendar } from "./pages/calendar/DiaryCalendar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NotFound } from "./components/NotFound";
import { DiarySplash } from "./components/DiarySplash";
import { MainLayout } from "./layouts/MainLayout";

const SPLASH_SESSION_KEY = "diary-splash-shown";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  const [appReady, setAppReady] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SPLASH_SESSION_KEY) === "true";
    } catch {
      return false;
    }
  });

  const handleSplashDone = useCallback(() => {
    try {
      sessionStorage.setItem(SPLASH_SESSION_KEY, "true");
    } catch {
      // Safe fallback if sessionStorage is unavailable
    }
    setAppReady(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              className:
                "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 border",
              duration: 4000,
            }}
          />

          {!appReady && <DiarySplash onComplete={handleSplashDone} />}

          <ErrorBoundary>
            <div
              className={
                appReady
                  ? "opacity-100 transition-opacity duration-500"
                  : "opacity-0 pointer-events-none"
              }
            >
              <BrowserRouter>
                <NavigationProvider>
                  <Routes>
                    {/* Standalone Auth Pages (No Floating Nav) */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route
                      path="/reset-password/:token"
                      element={<ResetPassword />}
                    />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route
                      path="/verification-success"
                      element={<VerificationSuccess />}
                    />

                    {/* Public Landing Page (Retains dedicated hero navigation, NO GlobalNavbar) */}
                    <Route path="/" element={<Landing />} />

                    {/* ==================================================== */}
                    {/* APP PAGES (Shared Persistent Global Navbar & Bottom Nav) */}
                    {/* ==================================================== */}
                    <Route element={<MainLayout />}>
                      <Route path="/stories" element={<Stories />} />
                      <Route path="/stories/:id" element={<StoryRead />} />

                      {/* Protected App Routes */}
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
                            <Profile />
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
                        path="/diary/calendar"
                        element={
                          <ProtectedRoute>
                            <DiaryCalendar />
                          </ProtectedRoute>
                        }
                      />
                    </Route>

                    {/* 404 Standalone Page */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </NavigationProvider>
              </BrowserRouter>
            </div>
          </ErrorBoundary>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;