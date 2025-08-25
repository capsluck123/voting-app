import React, { useEffect, useState } from "react";
import translations from '../translations';
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";
// Sidebar import removed; will be handled by App.js

const ResultDashboard = () => {
  const language = localStorage.getItem('language') || 'en';
  const t = translations[language];
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [votingClosed, setVotingClosed] = useState(false);

  useEffect(() => {
    // Fetch the latest election and check if it has ended
    const checkVotingClosed = async () => {
      setLoading(true);
      try {
        const electionsSnap = await getDocs(collection(firestore, "elections"));
        let latestEnd = null;
        electionsSnap.forEach(docSnap => {
          const data = docSnap.data();
          if (data.endDate) {
            const end = new Date(data.endDate);
            if (!latestEnd || end > latestEnd) latestEnd = end;
          }
        });
        if (latestEnd && new Date() > latestEnd) {
          setVotingClosed(true);
          fetchResults();
        } else {
          setVotingClosed(false);
          setLoading(false);
        }
      } catch (err) {
        setError("Failed to check election status.");
        setLoading(false);
      }
    };
    checkVotingClosed();
    // eslint-disable-next-line
  }, []);

  const fetchResults = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "candidates"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by votes descending
      data.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      setResults(data);
    } catch (err) {
      setError("Failed to fetch results.");
    }
    setLoading(false);
  };

  if (!votingClosed) {
    const isDark = typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark';
    return (
      <div style={{textAlign:'center',marginTop:40}}>
        <h2 style={{color: isDark ? '#fff' : '#23272f'}}>{t.resultsAvailableAfterVoting || 'Election results will be available after voting closes.'}</h2>
      </div>
    );
  }

  // Group candidates by role
  const candidatesByRole = results.reduce((acc, c) => {
    if (!acc[c.role]) acc[c.role] = [];
    acc[c.role].push(c);
    return acc;
  }, {});

  // Define the desired order of roles
  const roleOrder = [
    'president',
    'vice president',
    'secretary',
    'treasurer',
    'auditor',
    'P.I.O',
    'peace officer',
    'grade 11 representative',
    'grade 12 representative'
  ];

  return (
  <div className="result-dashboard" style={{maxWidth:600,margin:"40px auto",padding:24,background:"#e3f2fd",borderRadius:12,boxShadow:"0 2px 12px #e3f2fd"}}>
      <h2 style={{textAlign:'center',marginBottom:24}}>{t.electionResults || 'Election Results'}</h2>
      {loading ? (
        <div>{t.loadingResults || 'Loading results...'}</div>
      ) : error ? (
        <div style={{color:'red'}}>{error}</div>
      ) : (
        <div>
          {roleOrder.map(role => {
            if (!candidatesByRole[role]) return null;
            const candidates = candidatesByRole[role].slice().sort((a, b) => (b.votes || 0) - (a.votes || 0));
            const winner = candidates[0];
            return (
              <div key={role} style={{marginBottom:32}}>
                <h3 style={{color:'#191654',marginBottom:8}}>{role.charAt(0).toUpperCase() + role.slice(1)}</h3>
                <div style={{marginBottom:8,background:'#e3f2fd',padding:12,borderRadius:8,boxShadow:'0 2px 8px #90caf9',display:'flex',alignItems:'center'}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:'bold',fontSize:'1.1em'}}>{t.winner || 'Winner'}: {winner.name}</div>
                    <div style={{color:'#1976d2'}}>{t.grade || 'Grade'}: {winner.grade}</div>
                    <div style={{color:'#555'}}><b>{t.platforms || 'Platforms'}:</b> {winner.platforms}</div>
                  </div>
                  <div style={{fontWeight:700,fontSize:'1.3em',color:'#1976d2',marginLeft:16}}>{winner.votes} {t.votes || 'votes'}</div>
                </div>
                <ul style={{listStyle:'none',padding:0}}>
                  {candidates.map((c, idx) => (
                    <li key={c.id} style={{display:'flex',alignItems:'center',marginBottom:10,padding:10,borderRadius:6,background:'#f7fbff'}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:'bold'}}>{c.name}</div>
                        <div style={{color:'#1976d2'}}>{t.grade || 'Grade'}: {c.grade}</div>
                      </div>
                      <div style={{fontWeight:600,color:'#1976d2',marginLeft:12}}>{c.votes} {t.votes || 'votes'}</div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResultDashboard;
