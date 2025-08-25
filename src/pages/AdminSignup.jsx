import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, firestore } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const ADMIN_SECRET = "C@p$L9ck!2025"; // For demo only! Use env/obfuscation in production.

const AdminSignup = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [secretError, setSecretError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSecretSubmit = (e) => {
    e.preventDefault();
    if (secret === ADMIN_SECRET) {
      setShowForm(true);
      setSecretError("");
    } else {
      setSecretError("Incorrect access code. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
      await setDoc(doc(firestore, "users", user.uid), {
        name: form.name,
        email: form.email,
        role: "admin",
        hasVoted: false
      });
      localStorage.setItem("role", "admin");
      setSuccess("Account successfully created! You may now log in as admin.");
      // Show notification
      if (window.Notification && Notification.permission === "granted") {
        new Notification("Sign Up Successful", { body: "Your admin account has been created!" });
      } else if (window.Notification && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification("Sign Up Successful", { body: "Your admin account has been created!" });
          }
        });
      }
      // Do NOT navigate automatically after sign up
    } catch (err) {
      setError(err.message);
    }
  };

  return (
  <div className="signup-container" style={{background:'#e3f2fd'}}>
      <h2>Admin Sign Up</h2>
      {!showForm ? (
        <form onSubmit={handleSecretSubmit} style={{marginBottom:24, background:'#f8fefd', border:'2px solid #90caf9', borderRadius:10, padding:20, maxWidth:340, marginLeft:'auto', marginRight:'auto'}}>
          <div style={{marginBottom:10, fontWeight:600}}>Enter developer access code to continue:</div>
          <div style={{position:'relative', marginBottom:10}}>
            <input
              type={showSecret ? "text" : "password"}
              placeholder="Access code"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              style={{width:'100%',padding:12,borderRadius:8,border:'2px solid #90caf9',fontSize:'1.08em',background:'#f8fefd',color:'#222',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s',paddingRight:44}}
              required
            />
            <button
              type="button"
              onClick={() => setShowSecret(s => !s)}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32
              }}
              tabIndex={-1}
              aria-label={showSecret ? 'Hide access code' : 'Show access code'}
            >
              {showSecret ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#90caf9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5.05 0-9.29-3.14-11-8 1.06-2.67 2.99-4.88 5.47-6.32"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.93 0 3.5-1.57 3.5-3.5 0-.47-.09-.92-.26-1.33"/></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#90caf9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="6"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          <button type="submit" style={{background:'#90caf9',color:'#fff',padding:'8px 18px',borderRadius:6,border:'none',fontWeight:600,cursor:'pointer',width:'100%'}}>Continue</button>
          {secretError && <p className="red" style={{marginTop:8}}>{secretError}</p>}
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required style={{width:'100%',padding:12,marginBottom:12,borderRadius:8,border:'2px solid #90caf9',fontSize:'1.08em',background:'#f8fefd',color:'#222',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s'}} />
          <input name="email" type="email" placeholder="Email address" value={form.email} onChange={handleChange} required style={{width:'100%',padding:12,marginBottom:12,borderRadius:8,border:'2px solid #90caf9',fontSize:'1.08em',background:'#f8fefd',color:'#222',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s'}} />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required style={{width:'100%',padding:12,marginBottom:12,borderRadius:8,border:'2px solid #90caf9',fontSize:'1.08em',background:'#f8fefd',color:'#222',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s'}} />
          <button type="submit">Sign Up as Admin</button>
          {error && <p className="red">{error}</p>}
          {success && <p className="green">{success}</p>}
        </form>
      )}
      <button onClick={() => navigate('/')}>Back to Login</button>
    </div>
  );
};

export default AdminSignup;
