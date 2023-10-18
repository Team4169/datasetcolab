import React, { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function UpdateProfile() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { currentUser, updatePassword_, updateEmail_ } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  let navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError("Passwords do not match");
    }

    const promises = [];
    setLoading(true);
    setError("");

    if (emailRef.current.value !== currentUser.email) {
      promises.push(updateEmail_(emailRef.current.value));
    }
    if (passwordRef.current.value) {
      promises.push(updatePassword_(passwordRef.current.value));
    }

    Promise.all(promises)
      .then(() => {
        navigate("/");
      })
      .catch(() => {
        setError("Failed to update account");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6 offset-md-3">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Update Profile</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Email:</label>
                  <input type="email" className="form-control" ref={emailRef} required />
                </div>
                <div className="form-group">
                  <label>Password:</label>
                  <input type="password" className="form-control" ref={passwordRef} required />
                </div>
                <div className="form-group">
                  <label>Password Confirmation:</label>
                  <input type="password" className="form-control" ref={passwordConfirmRef} required />
                </div>
                <div className="mb-3 pt-2">
                  <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    Update
                  </button>
                </div>
              </form>
              <div className="mt-3">
                <Link to="/">Cancel</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}