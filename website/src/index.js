import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./contexts/PrivateRoute";

import Navbar from "./components/Navbar";

import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/UploadDataset";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Settings from "./pages/Settings";
import EmailVerification from "./pages/EmailVerification";
import Docs from "./pages/Docs";
import DownloadDataset from "./pages/DownloadDataset";
import DeleteAccount from "./pages/DeleteAccount";
import PretrainedModels from "./pages/PretrainedModels";
import View from "./pages/View";
import AboutUs from "./pages/AboutUs";
import EmbeddedDownload from "./pages/EmbeddedDownload";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {(window.location.pathname !== "/embed") ? (
          <div className="container mt-2">
            <Navbar />
            <div className="row">
              <Routes>
                <Route
                  exact
                  path="/"
                  element={
                    <PrivateRoute noAuth={<Navigate to="/models" />}>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route exact path="/models" element={<PretrainedModels />} />
                <Route
                  exact
                  path="/upload"
                  element={
                    <PrivateRoute>
                      <div className="col-md-6 offset-md-0">
                        <Upload />
                      </div>
                    </PrivateRoute>
                  }
                />
                <Route exact path="/docs" element={<Navigate to="/docs/YOLOv5n" />} />
                <Route exact path="/docs/*" element={<Docs />} />
                <Route
                  exact
                  path="/download"
                  element={
                    <div className="col-md-6 offset-md-0">
                      <DownloadDataset />
                    </div>
                  }
                />
                <Route
                  exact
                  path="/about"
                  element={
                    <div className="col-md-6 offset-md-0">
                      <AboutUs />
                    </div>
                  }
                />
                <Route exact path="/delete" element={<DeleteAccount />} />
                <Route
                  path="/settings"
                  element={
                    <PrivateRoute>
                      <div className="col-md-6 offset-md-0">
                        <Settings />
                      </div>
                    </PrivateRoute>
                  }
                />
                <Route path="/signup" element={
                  <div className="col-md-6 offset-md-0"><Signup />
                  </div>} />
                <Route path="/login" element={
                  <div className="col-md-6 offset-md-0"><Login />
                  </div>} />
                <Route path="/forgot-password" element={<div className="col-md-6 offset-md-0"><ForgotPassword />
                </div>} />
                <Route
                  path="/email-verification"
                  element={
                    <div className="col-md-6 offset-md-0">
                      <EmailVerification />
                    </div>
                  }
                />
                <Route path="/view/*" element={<View />} />
                <Route path="/embed" element={<EmbeddedDownload />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </div>
        ) : (

          <Routes>
            <Route path="/embed" element={<EmbeddedDownload />} />
          </Routes>
        )}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
