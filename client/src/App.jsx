// REACT IMPORTS
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

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

function App() {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 max-w-full">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Static Public Pages */}
            <Route path="/" element={<Home />} />
            {<Route path="/updates" element={<Updates />} />}

            {/* Authentication Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Pages */}
            <Route element={<RequireAuth />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/editor/:tabId" element={<MainTabEditor />} />
              <Route
                path="/editor/*"
                element={<Navigate to="/notfound" replace />}
              />
            </Route>

            {/* Catch All Pages */}
            <Route path="notfound" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/notfound" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
