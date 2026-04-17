import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import MainTabEditor from "./components/MainTabEditor";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Updates from "./pages/Updates";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import RequireAuth from "./components/RequireAuth";
import { AuthProvider } from "./context/authProvider";
import { ThemeProvider } from "./context/themeProvider";
import AppLayout from "./layouts/AppLayout";
import AppLayoutNoFooter from "./layouts/AppLayoutNoFooter";
import SidebarLayout from "./layouts/SidebarLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="pinniped-theme">
        <div className="bg-background text-foreground w-full">
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public pages with Header + Footer */}
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/notfound" element={<NotFound />} />
                </Route>

                {/* Pages with Header only (no Footer) */}
                <Route element={<AppLayoutNoFooter />}>
                  <Route path="/updates" element={<Updates />} />
                </Route>

                {/* Authenticated pages with sidebar */}
                <Route element={<RequireAuth />}>
                  <Route element={<SidebarLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/editor/:tabId" element={<MainTabEditor />} />
                    <Route
                      path="/editor/*"
                      element={<Navigate to="/notfound" replace />}
                    />
                  </Route>
                </Route>

                {/* Catch All */}
                <Route path="*" element={<Navigate to="/notfound" replace />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </div>
      </ThemeProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export default App;
