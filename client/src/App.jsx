import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

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

/**
 * The two heavy routes are loaded on demand.
 *
 * The editor pulls in Tiptap and ProseMirror (~127 kB gzipped) for the lyric panel and
 * react-markdown (~36 kB) for the notes panel; the Orchid pulls in its synth engine.
 * Neither is reachable from the landing page, so shipping them in the initial bundle
 * meant a first-time visitor downloaded a rich-text editor to look at a marketing page.
 */
const MainTabEditor = lazy(() => import("./components/MainTabEditor"));
const Orchid = lazy(() => import("./pages/Orchid"));

/**
 * Wraps a lazy route in its own Suspense boundary.
 *
 * Per-route rather than one boundary around <Routes>: the layouts are themselves route
 * elements, so a single outer boundary would blank the header and sidebar while the
 * chunk downloads instead of just the page body.
 */
function LazyRoute({ children }) {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto w-full px-4 py-8">
          <div className="h-8 w-48 mb-6 bg-muted animate-pulse rounded-sm" />
          <div className="h-64 bg-muted animate-pulse rounded-sm" />
        </div>
      }>
      {children}
    </Suspense>
  );
}

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
                  {/* Standalone play surface — no tab context needed. */}
                  <Route
                    path="/orchid"
                    element={
                      <LazyRoute>
                        <Orchid />
                      </LazyRoute>
                    }
                  />
                </Route>

                {/* Authenticated pages with sidebar */}
                <Route element={<RequireAuth />}>
                  <Route element={<SidebarLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route
                      path="/editor/:tabId"
                      element={
                        <LazyRoute>
                          <MainTabEditor />
                        </LazyRoute>
                      }
                    />
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
