// REACT IMPORTS
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

// STYLE IMPORTS
import "./App.css";

import MainTabEditor from "./components/MainTabEditor";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import TablabContextLayout from "./layouts/TablabContextLayout";
import NotFound from "./pages/NotFound";
import Updates from "./pages/Updates";
import Guide from "./pages/Guide";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/updates" element={<Updates />} />
        <Route path="/guide" element={<Guide />} />

        <Route element={<TablabContextLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/editor/:tabId" element={<MainTabEditor />} />
          <Route
            path="/editor/*"
            element={<Navigate to="/notfound" replace />}
          />
        </Route>

        <Route path="notfound" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/notfound" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
