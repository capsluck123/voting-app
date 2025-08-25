import React, { useEffect, useState } from "react";
import translations from '../translations';
import { useParams, useNavigate } from "react-router-dom";
import { firestore } from "../firebase";
import { doc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

const CandidateProfile = () => {
  const language = localStorage.getItem('language') || 'en';
  const t = translations[language];
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allCandidates, setAllCandidates] = useState([]);
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState("");

  // Check admin role from localStorage (simple client-side check)
  const isAdmin = localStorage.getItem("role") === "admin";

  const handleDelete = async (candidateId) => {
    if (!window.confirm("Are you sure you want to delete this candidate? This cannot be undone.")) return;
    setDeleting(candidateId);
    try {
      await deleteDoc(doc(firestore, "candidates", candidateId));
      setAllCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      if (id === candidateId) navigate("/candidate");
    } catch (err) {
      alert("Failed to delete candidate: " + err.message);
    }
    setDeleting("");
  };

  useEffect(() => {
    const fetchCandidate = async () => {
      if (!id) {
        // If no id param, show all candidates
        try {
          const querySnapshot = await getDocs(collection(firestore, "candidates"));
          setAllCandidates(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
          setAllCandidates([]);
        }
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(firestore, "candidates", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCandidate(docSnap.data());
        } else {
          setCandidate(null);
        }
      } catch (err) {
        setCandidate(null);
      }
      setLoading(false);
    };
    fetchCandidate();
  }, [id]);

  if (loading) return <div className="vote-page">{t.loading || 'Loading...'}</div>;

  // If no id param, show all candidates as a list
  if (!id) {
    // Group candidates by role
    const candidatesByRole = allCandidates.reduce((acc, c) => {
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
    const isDark = typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark';
    return (
      <div className="vote-page">
  <h2>{t.partialResults || 'Partial & Unofficial Results'}</h2>
  {allCandidates.length === 0 && <div>{t.noCandidates || 'No candidates found.'}</div>}
        {roleOrder.filter(role => candidatesByRole[role] && candidatesByRole[role].length > 0).map(role => (
          <div key={role} style={{marginBottom:32}}>
            <h3 style={{marginBottom:16, color:'#191654', fontWeight:700, fontSize:'1.18em', letterSpacing:0.5}}>{role.charAt(0).toUpperCase() + role.slice(1)}</h3>
            <ul style={{padding:0, margin:0, listStyle:'none'}}>
              {candidatesByRole[role]
                .slice()
                .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                .map(c => (
                  <li key={c.id} style={{
                    display:'flex',alignItems:'center',gap:18,marginBottom:18,background:'#e3f2fd',borderRadius:14,padding:'18px 16px',
                    position:'relative'
                  }}>
                    {c.image ? (
                      <img src={c.image} alt={c.name} style={{width:64,height:64,objectFit:'cover',borderRadius:12,background:'#fff',border:'2px solid #43c6ac55'}} />
                    ) : (
                      <div style={{width:64,height:64,background:'#e0e0e0',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',color:'#888',fontWeight:600,fontSize:28}}>?</div>
                    )}
                    <div style={{flex:1}}>
                      <div style={{fontWeight:'bold',fontSize:'1.1em',marginBottom:4, color: isDark ? '#fff' : '#23272f'}}>{c.name}</div>
                      <div style={{color:'#555',marginBottom:6}}>{c.description}</div>
                      <div style={{color:'#fda085',fontWeight:600}}>{t.votes || 'Votes'}: {c.votes}</div>
                    </div>
                    {isAdmin && (
                      <button style={{background:'#e74c3c',color:'#fff',minWidth:70,position:'absolute',right:24,top:'50%',transform:'translateY(-50%)'}} onClick={() => handleDelete(c.id)} disabled={deleting===c.id}>
                        {deleting===c.id ? (t.deleting || 'Deleting...') : (t.delete || 'Delete')}
                      </button>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  if (!candidate) return <div className="vote-page">{t.candidateNotFound || 'Candidate not found.'}</div>;

  return (
    <div className="vote-page">
  <button onClick={() => navigate(-1)} style={{marginBottom:16}}>{t.back || 'Back'}</button>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
        {candidate.image ? (
          <img src={candidate.image} alt={candidate.name} style={{width:120,height:120,objectFit:'cover',borderRadius:16,marginBottom:16}} />
        ) : (
          <div style={{width:120,height:120,background:'#e0e0e0',borderRadius:16,marginBottom:16,display:'flex',alignItems:'center',justifyContent:'center',color:'#888',fontWeight:600,fontSize:48}}>
            ?
          </div>
        )}
  <h2>{candidate.name}</h2>
        <div style={{
          marginBottom: 16,
          color: '#191654',
          fontWeight: 500,
          fontSize: '1.05em',
          width: '100%',
          maxWidth: 340,
          background: '#f8fefd',
          borderRadius: 10,
          padding: '16px 20px',
          boxShadow: '0 2px 8px #e3f2fd',
          border: '1.5px solid #43c6ac33',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          {candidate.role && <div><span style={{fontWeight:600}}>{t.role || 'Role'}:</span> <span style={{color:'#222', fontWeight:400}}>{candidate.role}</span></div>}
          {candidate.grade && <div><span style={{fontWeight:600}}>{t.gradeLevel || 'Grade Level'}:</span> <span style={{color:'#222', fontWeight:400}}>{candidate.grade}</span></div>}
          {candidate.strand && <div><span style={{fontWeight:600}}>{t.strand || 'Strand'}:</span> <span style={{color:'#222', fontWeight:400}}>{candidate.strand}</span></div>}
          {candidate.platforms && (
            <div style={{marginTop:8}}>
              <span style={{fontWeight:600, color:'#191654'}}>{t.platforms || 'Platforms'}:</span>
              <div style={{color:'#555',marginTop:2,whiteSpace:'pre-line',fontWeight:400}}>{candidate.platforms}</div>
            </div>
          )}
        </div>
  <div style={{color:'#fda085',fontWeight:600,fontSize:'1.1em'}}>{t.votes || 'Votes'}: {candidate.votes}</div>
        {isAdmin && (
          <button style={{background:'#e74c3c',color:'#fff',marginTop:18,minWidth:90}} onClick={() => handleDelete(id)} disabled={deleting===id}>
            {deleting===id ? (t.deleting || 'Deleting...') : (t.deleteCandidate || 'Delete Candidate')}
          </button>
        )}
      </div>
    </div>
  );
};

export default CandidateProfile;
