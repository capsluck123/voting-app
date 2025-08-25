import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, firestore } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, addDoc, collection, updateDoc } from "firebase/firestore";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  // Show force logout message if present
  useEffect(() => {
    const msg = localStorage.getItem("forceLogoutMessage");
    if (msg) {
      setError(msg);
      localStorage.removeItem("forceLogoutMessage");
    }
  }, []);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Generate a random session ID
  const generateSessionId = () => Math.random().toString(36).substr(2) + Date.now().toString(36);

  // On every page load, check sessionId in Firestore vs localStorage
  useEffect(() => {
    const checkSession = async () => {
      const uid = localStorage.getItem("uid");
      const localSessionId = localStorage.getItem("sessionId");
      if (uid && localSessionId) {
        const userDocRef = doc(firestore, "users", uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data.sessionId && data.sessionId !== localSessionId) {
            // Session mismatch, force logout
            localStorage.removeItem("role");
            localStorage.removeItem("uid");
            localStorage.removeItem("sessionId");
            setError("You have been logged out because your account was opened in another browser or device.");
            // Optionally, redirect to login
            navigate("/");
          }
        }
      }
    };
    checkSession();
    // Optionally, set interval to check every X seconds
    const interval = setInterval(checkSession, 10000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
  const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
  const user = userCredential.user;
  const sessionId = generateSessionId();
  // Debug log for Firestore path and UID
  console.log("Login: user.uid =", user.uid);
  console.log("Login: Firestore doc path = users/" + user.uid);
  // Save sessionId in Firestore
  await updateDoc(doc(firestore, "users", user.uid), { sessionId });
  // Save sessionId in localStorage
  localStorage.setItem("sessionId", sessionId);
  const userDoc = await getDoc(doc(firestore, "users", user.uid));
  const data = userDoc.data();
      // Log successful login
      await addDoc(collection(firestore, "userActivityLogs"), {
        userId: user.uid,
        email: form.email,
        type: "login_success",
        timestamp: new Date().toISOString(),
      });
      if (data.role === "admin") {
        localStorage.setItem("role", "admin");
        localStorage.setItem("uid", user.uid);
        navigate("/admin");
      } else {
        if (data.approved === false) {
          setError("Your account is pending admin approval. Please wait for approval before logging in.");
          return;
        }
        localStorage.setItem("role", "student");
        localStorage.setItem("uid", user.uid);
        navigate("/vote");
      }
    } catch (err) {
      setError(err.message);
      // Log failed login attempt
      await addDoc(collection(firestore, "userActivityLogs"), {
        email: form.email,
        type: "login_failed",
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
  <div className="login-container" style={{background:'#e3f2fd'}}>
      <h2>Welcome</h2>
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="Email address" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <div style={{marginTop:8,marginBottom:8}}>
          <a href="/reset-password" style={{color:'#72a0c5ff',textDecoration:'underline',fontSize:'0.98em'}}>Forgot Password?</a>
        </div>
        <button type="submit">Sign In</button>
        {error && <p className="red">{error}</p>}
      </form>
      <button onClick={() => navigate('/signup')}>Create Student Account</button>
      <button onClick={() => navigate('/admin-signup')} style={{marginTop:8}}>Create Admin Account</button>
    </div>
  );
};

export default Login;
