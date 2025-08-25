import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { firestore } from "../firebase";
// Sidebar import removed; will be handled by App.js

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(firestore, "auditLogs"));
        const logData = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          // Optionally fetch user info
          let userName = data.userId;
          try {
            const userDoc = await getDoc(doc(firestore, "users", data.userId));
            if (userDoc.exists()) userName = userDoc.data().name || userDoc.data().email || data.userId;
          } catch {}
          return {
            ...data,
            id: docSnap.id,
            userName,
            timestamp: data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : null,
          };
        }));
        // Sort by most recent
        logData.sort((a, b) => (b.timestamp?.getTime?.() || 0) - (a.timestamp?.getTime?.() || 0));
        setLogs(logData);
      } catch (err) {
        setError("Failed to fetch audit logs.");
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
  <div className="audit-log-page" style={{maxWidth:950,margin:"40px auto",padding:0,background:"transparent",borderRadius:0,boxShadow:"none"}}>
      <h2 style={{textAlign:'center',marginBottom:24}}>Audit Log</h2>
      {loading ? (
        <div>Loading logs...</div>
      ) : error ? (
        <div style={{color:'red'}}>{error}</div>
      ) : logs.length === 0 ? (
        <div style={{textAlign:'center'}}>No audit logs found.</div>
      ) : (
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#e3f2fd'}}>
              <th style={{padding:'8px',border:'1px solid #e0e0e0'}}>User</th>
              <th style={{padding:'8px',border:'1px solid #e0e0e0'}}>Role</th>
              <th style={{padding:'8px',border:'1px solid #e0e0e0'}}>Candidate</th>
              <th style={{padding:'8px',border:'1px solid #e0e0e0'}}>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td style={{padding:'8px',border:'1px solid #e0e0e0'}}>{log.userName}</td>
                <td style={{padding:'8px',border:'1px solid #e0e0e0'}}>{log.role}</td>
                <td style={{padding:'8px',border:'1px solid #e0e0e0'}}>{log.candidateName || log.candidateId}</td>
                <td style={{padding:'8px',border:'1px solid #e0e0e0'}}>{log.timestamp ? log.timestamp.toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AuditLog;
