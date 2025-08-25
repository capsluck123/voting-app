import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, firestore } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

const Signup = () => {
  const [form, setForm] = useState({
    name: "",
    lrn: "",
    strand: "",
    device: "",
    email: "",
    password: ""
  });
  const [honorPledge, setHonorPledge] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // 1. Honor pledge required
    if (!honorPledge) {
      setError("You must agree to the honor pledge before signing up.");
      return;
    }
    try {
      // 2. Generate/retrieve deviceId
      let deviceId = localStorage.getItem("device_id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("device_id", deviceId);
      }
      // 3. Check duplicate LRN
      const lrnQ = query(collection(firestore, "users"), where("lrn", "==", form.lrn));
      const lrnSnap = await getDocs(lrnQ);
      if (!lrnSnap.empty) {
        setError("This LRN is already registered.");
        return;
      }
      // 4. Check duplicate deviceId
      const deviceQ = query(collection(firestore, "users"), where("deviceId", "==", deviceId));
      const deviceSnap = await getDocs(deviceQ);
      if (!deviceSnap.empty) {
        setError("This device has already been used to register.");
        return;
      }
      // 5. Proceed with signup
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
      await setDoc(doc(firestore, "users", user.uid), {
        name: form.name,
        lrn: form.lrn,
        strand: form.strand,
        device: form.device,
        email: form.email,
        password: form.password,
        role: "student",
        deviceId,
        hasVoted: false,
        approved: false // Admin must approve before student can access
      });
      localStorage.setItem("role", "student");
      setSuccess("Account successfully created! You may now log in and vote.");
      // Show notification
      if (window.Notification && Notification.permission === "granted") {
        new Notification("Sign Up Successful", { body: "Your account has been created!" });
      } else if (window.Notification && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification("Sign Up Successful", { body: "Your account has been created!" });
          }
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Removed admin/developer prompt state

  return (
  <div className="signup-container" style={{background:'#e3f2fd'}}>
      <h2>Create Student Account</h2>
      <form onSubmit={handleSubmit}>
  <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required style={{width:'100%',padding:12,marginBottom:12,borderRadius:8,border:'2px solid #90caf9',fontSize:'1.08em',background:'#f8fefd',color:'#222',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s'}} />
  <input name="lrn" placeholder="LRN (Learner Reference Number)" value={form.lrn} onChange={handleChange} required style={{width:'100%',padding:12,marginBottom:12,borderRadius:8,border:'2px solid #90caf9',fontSize:'1.08em',background:'#f8fefd',color:'#222',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s'}} />
  <input name="strand" placeholder="Strand (e.g. STEM, HUMSS)" value={form.strand} onChange={handleChange} required style={{width:'100%',padding:12,marginBottom:12,borderRadius:8,border:'2px solid #90caf9',fontSize:'1.08em',background:'#f8fefd',color:'#222',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s'}} />
  <input name="device" placeholder="Device (e.g. Android, iOS, PC)" value={form.device} onChange={handleChange} required style={{width:'100%',padding:12,marginBottom:12,borderRadius:8,border:'2px solid #90caf9',fontSize:'1.08em',background:'#f8fefd',color:'#222',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s'}} />
  <input name="email" type="email" placeholder="Email address" value={form.email} onChange={handleChange} required style={{width:'100%',padding:12,marginBottom:12,borderRadius:8,border:'2px solid #90caf9',fontSize:'1.08em',background:'#f8fefd',color:'#222',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s'}} />
  <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required style={{width:'100%',padding:12,marginBottom:12,borderRadius:8,border:'2px solid #90caf9',fontSize:'1.08em',background:'#f8fefd',color:'#222',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s'}} />
        <div style={{marginBottom:12,display:'flex',alignItems:'center'}}>
          <input type="checkbox" id="honorPledge" checked={honorPledge} onChange={e => setHonorPledge(e.target.checked)} required style={{marginRight:8}} />
          <label htmlFor="honorPledge" style={{fontSize:'0.98em',color:'#222'}}>I understand that cheating may result in disqualification.</label>
        </div>
        <button type="submit">Sign Up</button>
        {error && <p className="red">{error}</p>}
        {success && <p className="green">{success}</p>}
      </form>
      {/* Admin/developer access button and modal removed */}
      {/* Admin/developer access button and modal removed */}
      <button onClick={() => navigate('/')} style={{marginTop: 12}}>Back to Login</button>
    </div>
  );
};

export default Signup;
