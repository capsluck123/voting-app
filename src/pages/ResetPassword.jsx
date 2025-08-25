import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("A password reset link has been sent to your email.");
      setTimeout(() => navigate("/"), 3000); // Optionally redirect after 3s
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="reset-password-page" style={{
      maxWidth: 400,
      margin: "40px auto",
      padding: 24,
  background: "#e3f2fd",
      borderRadius: 12,
      boxShadow: "0 2px 8px #0001",
      border: "2px solid #90caf9"
    }}>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 16,
            borderRadius: 8,
            border: "2px solid #90caf9",
            fontSize: "1.08em",
            background: "#e3f2fd",
            color: "#222",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.2s"
          }}
          onFocus={e => e.target.style.borderColor = '#90caf9'}
          onBlur={e => e.target.style.borderColor = '#90caf9'}
        />
        <button type="submit" disabled={loading} style={{width:"100%",padding:10,borderRadius:6,background:"#90caf9",color:"#fff",fontWeight:600}}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        {message && <p style={{color:"green",marginTop:12}}>{message}</p>}
        {error && <p style={{color:"red",marginTop:12}}>{error}</p>}
      </form>
    </div>
  );
};

export default ResetPassword;
