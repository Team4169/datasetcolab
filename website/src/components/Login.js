import React, { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
//import 'bootstrap/dist/css/bootstrap.css';

export default function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  let navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      await login(emailRef.current.value, passwordRef.current.value);
      navigate("/");
    } catch {
      setError("Failed to log in");
    }

    setLoading(false);
  }

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6 offset-md-3">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Log In</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input type="text" name="email" id="email" className="form-control" ref={emailRef} required />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password:</label>
                  <input type="password" name="password" id="password" className="form-control" ref={passwordRef} required />
                </div>
                <div className="mb-3 pt-2">
                  <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    Log In
                  </button>
                </div>
              </form>
              <div className="mt-3">
                <Link to="/forgot-password">Forgot Password?</Link>
              </div>
              <div className="mt-2">
                Don't have an account? <Link to="/signup">Sign Up</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}