// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import OtpLogin from "./pages/OtpLogin";

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar visible on all pages */}
      <Navbar />

      {/* Page content */}
      <div className="flex-grow">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/phone-login" element={<OtpLogin />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          {/* Add other routes here */}
        </Routes>
      </div>
    </div>
  );
}

export default App;
