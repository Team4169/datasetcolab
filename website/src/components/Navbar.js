import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap CSS

export default function EmailVerification() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch {
      // Handle error
    }
  }

  if (!currentUser) {
    return (
      <div style={{ backgroundColor: "inherit" }}>
        <Navbar bg="inherit" expand="lg">
          <Navbar.Brand onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            FRC Dataset Colab
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav>
              <Nav.Link onClick={() => navigate("/docs")} style={{ cursor: "pointer" }}>Docs</Nav.Link>
              <Nav.Link onClick={() => navigate("/login")} style={{ cursor: "pointer" }}>Login</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "inherit" }}>
      <Navbar bg="inherit" expand="lg">
        <Navbar.Brand onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          FRC Dataset Colab
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav>
            <Nav.Link onClick={() => navigate("/upload")} style={{ cursor: "pointer" }}>Upload</Nav.Link>
            <Nav.Link onClick={() => navigate("/download")} style={{ cursor: "pointer" }}>Download Dataset</Nav.Link>
            <NavDropdown title="Account" id="basic-nav-dropdown">
              <NavDropdown.Item onClick={() => navigate("/update-profile")} style={{ cursor: "pointer" }}>Update Profile</NavDropdown.Item>
              <NavDropdown.Item onClick={handleLogout} style={{ cursor: "pointer" }}>Logout</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    </div>
  );
}
