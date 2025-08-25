import React, { useEffect, useState } from "react";
import { firestore } from "../firebase";
import { collection, getDocs, query, where, updateDoc, deleteDoc, doc } from "firebase/firestore";

const AdminApproval = () => {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState("");

  const fetchPendingStudents = async () => {
    setPendingLoading(true);
    setPendingError("");
    try {
      const q = query(collection(firestore, "users"), where("role", "==", "student"), where("approved", "==", false));
      const snap = await getDocs(q);
      const students = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Fetched pending students:", students);
      setPendingStudents(students);
    } catch (err) {
      setPendingError("Failed to fetch pending students.");
    }
    setPendingLoading(false);
  };

  useEffect(() => {
    fetchPendingStudents();
    // eslint-disable-next-line
  }, []);

  const handleApproveStudent = async (studentId) => {
    try {
      await updateDoc(doc(firestore, "users", studentId), { approved: true });
      setPendingStudents(pendingStudents.filter(s => s.id !== studentId));
    } catch (err) {
      setPendingError("Failed to approve student.");
    }
  };

  const handleRejectStudent = async (studentId) => {
    try {
      await deleteDoc(doc(firestore, "users", studentId));
      setPendingStudents(pendingStudents.filter(s => s.id !== studentId));
    } catch (err) {
      setPendingError("Failed to reject student.");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', background: 'transparent', padding: '40px 0' }}>
      <div style={{ width: '100%', maxWidth: 700, background: 'transparent', borderRadius: 18, boxShadow: '0 4px 24px #0001', padding: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 32, color: '#1a237e' }}>Pending Student Approvals</h2>
        {pendingLoading ? (
          <div style={{ textAlign: 'center', color: '#888' }}>Loading pending students...</div>
        ) : pendingError ? (
          <div style={{ textAlign: 'center', color: '#c0392b' }}>{pendingError}</div>
        ) : pendingStudents.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888' }}>No pending students.</div>
        ) : (
          <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
            {pendingStudents.map(s => (
              <li key={s.id} style={{ marginBottom: 18, display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: '#eaf2fb', borderRadius: 10, boxShadow: '0 2px 8px #2d6cdf11', padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #dde6f7', width: '100%', maxWidth: 480 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 18, color: '#1a237e' }}>{s.name}</div>
                    <div style={{ fontSize: 13, color: '#333' }}>LRN: {s.lrn}</div>
                    <div style={{ fontSize: 13, color: '#333' }}>Strand: {s.strand}</div>
                    <div style={{ fontSize: 13, color: '#333' }}>Email: {s.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleApproveStudent(s.id)} style={{ padding: '6px 16px', borderRadius: 6, background: '#43c6ac', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>Approve</button>
                    <button onClick={() => handleRejectStudent(s.id)} style={{ padding: '6px 16px', borderRadius: 6, background: '#e74c3c', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>Reject</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminApproval;
