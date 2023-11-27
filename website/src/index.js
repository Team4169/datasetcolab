import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./contexts/PrivateRoute";

import Navbar from "./components/Navbar";

import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Settings from "./pages/Settings";
import EmailVerification from "./pages/EmailVerification";
import Docs from "./pages/Docs";
import DownloadDataset from "./pages/DownloadDataset";
import DeleteAccount from "./pages/DeleteAccount";
import Home from "./pages/Home";
import View from "./pages/View";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <div className="container mt-2">
          <Navbar />
          <div className="row">
            <div className="col-md-6 offset-md-3">
              <Routes>
                <Route
                  exact
                  path="/"
                  element={
                    <PrivateRoute noAuth={<Home />}>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  exact
                  path="/upload"
                  element={
                    <PrivateRoute>
                      <Upload />
                    </PrivateRoute>
                  }
                />
                <Route
                  exact
                  path="/docs"
                  element={
                    <Docs />
                  }
                />
                <Route
                  exact
                  path="/download"
                  element={
                    <DownloadDataset />
                  }
                />
                <Route
                  exact
                  path="/delete"
                  element={
                    <DeleteAccount />
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <PrivateRoute>
                      <Settings />
                    </PrivateRoute>
                  }
                />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                  path="/email-verification"
                  element={<EmailVerification />}
                />
                
                <Route path="/view/:folderName" element={<View />} />
              </Routes>
            </div>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
