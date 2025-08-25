import { firestore } from "../firebase";
import { collection, getDocs, doc as fsDoc, getDoc as fsGetDoc } from "firebase/firestore";
import { auth } from "../firebase";

import React, { useEffect, useState } from "react";
import translations from '../translations';
import { useNavigate } from "react-router-dom";



const Vote = () => {
  const language = localStorage.getItem('language') || 'en';
  const t = translations[language];
  // Real-time status update clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10000); // update every 10 seconds
    return () => clearInterval(interval);
  }, []);
  // State for loading, candidates, error, election
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState(null);
  const [votedRoles, setVotedRoles] = useState({});
  const [votingRole, setVotingRole] = useState(null);
  const [isAdmin] = useState(false);
  const [deleting] = useState(null);
  const navigate = useNavigate();
  const handleVote = async (candidateId, role) => {
    if (!auth.currentUser) {
      setError("You must be logged in to vote.");
      return;
    }
    if (votingRole === role) return; // Prevent double click
    if (votedRoles[election?.id]?.includes(role)) {
      setError("You have already voted for this role.");
      return;
    }
    setVotingRole(role);
    setError(null);
    try {
      // Use Firestore transaction to ensure atomicity
  const { runTransaction, doc: txDoc, increment: txIncrement, addDoc, collection: fsCollection } = await import("firebase/firestore");
      await runTransaction(firestore, async (transaction) => {
        const userVoteRef = txDoc(firestore, "votes", auth.currentUser.uid + "_" + election.id);
        const candidateRef = txDoc(firestore, "candidates", candidateId);
        const userVoteDoc = await transaction.get(userVoteRef);
        let userVoteData = userVoteDoc.exists() ? userVoteDoc.data() : { roles: [] };
        if ((userVoteData.roles || []).includes(role)) {
          throw new Error("You have already voted for this role.");
        }
        // Increment candidate votes
        transaction.update(candidateRef, { votes: txIncrement(1) });
        // Always set userId on vote doc for both create and update
        const updatedRoles = [...(userVoteData.roles || []), role];
        transaction.set(userVoteRef, {
          roles: updatedRoles,
          electionId: election.id,
          userId: auth.currentUser.uid // Always set userId
        }, { merge: false }); // Use merge: false to guarantee userId is present
      });

      // Add audit log entry
      try {
        await addDoc(
          fsCollection(firestore, "auditLogs"),
          {
            userId: auth.currentUser.uid,
            action: "vote",
            candidateId,
            role,
            electionId: election.id,
            timestamp: (await import("firebase/firestore")).serverTimestamp(),
          }
        );
      } catch (auditErr) {
        console.error("Failed to record audit log:", auditErr);
      }

      // Update local state for instant feedback
      setVotedRoles(v => ({ ...v, [election.id]: [...(v[election.id] || []), role] }));
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, votes: (c.votes || 0) + 1 } : c));
    } catch (err) {
      setError("Failed to submit vote. Please try again. " + (err && err.message ? err.message : ""));
      console.error("Vote error (full):", err);
    } finally {
      setVotingRole(null);
    }
  };
  const handleDelete = () => {};
  const [election, setElection] = useState(null);
  const [electionLoading, setElectionLoading] = useState(true);
  const [authLoading] = useState(false); // Assume auth is ready for now
  // Fetch the current or upcoming election and candidates
  useEffect(() => {
    const fetchData = async () => {
      setElectionLoading(true);
      setLoading(true);
      try {
        // Fetch elections
        const electionsSnapshot = await getDocs(collection(firestore, 'elections'));
        const elections = electionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Pick the first ongoing or upcoming election
        const now = new Date();
        let activeElection = elections.find(e => {
          const start = new Date(e.startDate);
          const end = new Date(e.endDate);
          // Treat as active if now is within range, regardless of status
          return now >= start && now <= end;
        }) || elections.find(e => {
          const start = new Date(e.startDate);
          return now < start;
        });
        // If no ongoing or upcoming, show the most recent past event
        if (!activeElection && elections.length > 0) {
          activeElection = elections
            .slice()
            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
        }
        setElection(activeElection || null);

        // Fetch candidates
        const candidatesSnapshot = await getDocs(collection(firestore, 'candidates'));
        const candidatesList = candidatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCandidates(candidatesList);

        // Fetch user's vote for this election (if logged in)
        if (auth.currentUser && activeElection) {
          const userVoteRef = fsDoc(firestore, 'votes', auth.currentUser.uid + '_' + activeElection.id);
          const userVoteSnap = await fsGetDoc(userVoteRef);
          if (userVoteSnap.exists()) {
            const data = userVoteSnap.data();
            setVotedRoles(v => ({ ...v, [activeElection.id]: data.roles || [] }));
          }
        }
      } catch (e) {
        setError('Failed to load election or candidates.');
      } finally {
        setElectionLoading(false);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (authLoading || loading || electionLoading) return <div>{t.loading || 'Loading...'}</div>;

  // Calculate poll results
  // Group candidates by role
  const candidatesByRole = candidates.reduce((acc, c) => {
    if (!acc[c.role]) acc[c.role] = [];
    acc[c.role].push(c);
    return acc;
  }, {});
  // Calculate total votes per role
  const totalVotesByRole = Object.fromEntries(
    Object.entries(candidatesByRole).map(([role, candidates]) => [
      role,
      candidates.reduce((total, candidate) => total + (candidate.votes || 0), 0)
    ])
  );

  return (
    <div className="vote-page">
      {election ? (
        <div style={{background:'#e3f2fd',borderRadius:8,padding:16,marginBottom:24,maxWidth:500,margin:'0 auto 24px auto',boxShadow:'0 2px 8px #e3f2fd'}}>
          <h2 style={{marginBottom:8}}>{election.title}</h2>
          <div style={{color:'#1976d2',fontWeight:600,marginBottom:4}}>
            {t.status || 'Status'}: {(() => {
              const start = election.startDate ? new Date(election.startDate) : null;
              const end = election.endDate ? new Date(election.endDate) : null;
              if (start && end) {
                if (now < start) return t.upcoming || "Upcoming";
                if (now >= start && now <= end) return t.started || "Started";
                if (now > end) return t.ended || "Ended";
              }
              return election.status || t.unknown || "Unknown";
            })()}
          </div>
          <div style={{color:'#555',marginBottom:4}}>{t.start || 'Start'}: {election.startDate}</div>
          <div style={{color:'#555',marginBottom:4}}>{t.end || 'End'}: {election.endDate}</div>
        </div>
      ) : (
        <div style={{background:'#e3f2fd',borderRadius:8,padding:16,marginBottom:24,maxWidth:500,margin:'0 auto 24px auto',color:'#856404',textAlign:'center',boxShadow:'0 2px 8px #e3f2fd'}}>
          <h2>{t.noElection || 'No active or upcoming election event.'}</h2>
        </div>
      )}
      <h2>{t.voteForCandidate || 'Vote for Your Candidate'}</h2>
      {error && <p className="red">{error}</p>}
      {/* Voting section */}
      {/* Voting section */}
      <>
        {[
          'president',
          'vice president',
          'secretary',
          'treasurer',
          'auditor',
          'P.I.O',
          'peace officer',
          'grade 11 representative',
          'grade 12 representative',
        ].filter(role => candidatesByRole[role] && candidatesByRole[role].length > 0)
          .map(role => {
            const electionId = election?.id;
            const rolesArr = Array.isArray(votedRoles && votedRoles[electionId]) ? votedRoles[electionId] : [];
            const votedForThisRole = rolesArr.includes(role);
            return (
              <div key={role} style={{marginBottom:32}}>
                <h3 style={{color:'#191654',marginBottom:8}}>{role.charAt(0).toUpperCase() + role.slice(1)}</h3>
                <ul>
                  {candidatesByRole[role].map(c => {
                    const totalVotesForRole = totalVotesByRole[role] || 0;
                    const percent = totalVotesForRole > 0 ? Math.round((c.votes || 0) / totalVotesForRole * 100) : 0;
                    return (
                      <li key={c.id} style={{marginBottom:16, display:'flex', alignItems:'center', gap:18}}>
                        {c.image ? (
                          <img src={c.image} alt={c.name} style={{width:64, height:64, objectFit:'cover', borderRadius:12, background:'#fff', border:'2px solid #43c6ac55', cursor:'pointer'}} onClick={() => navigate(`/candidate/${c.id}`)} />
                        ) : (
                          <div style={{width:64, height:64, background:'#e0e0e0', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:'#888', fontWeight:600, fontSize:28, cursor:'pointer'}} onClick={() => navigate(`/candidate/${c.id}`)}>?</div>
                        )}
                        <div style={{flex:1}}>
                          <div style={{fontWeight:'bold', fontSize:'1.1em', marginBottom:4, cursor:'pointer'}} onClick={() => navigate(`/candidate/${c.id}`)}>{c.name}</div>
                          <div style={{color:'#fda085', fontWeight:600}}>Votes: {c.votes}</div>
                          <div style={{background:'#e0eafc', borderRadius:8, height:16, marginTop:8, marginBottom:4, width:'100%'}}>
                            <div style={{background:'linear-gradient(90deg,#43c6ac,#191654)', height:'100%', borderRadius:8, width:`${percent}%`, transition:'width 0.5s'}}></div>
                          </div>
                          <div style={{fontSize:'0.95em', color:'#191654', fontWeight:500}}>{percent}%</div>
                          <div style={{display:'flex', gap:8, marginTop:8}}>
                            <button
                              style={{padding:'6px 16px', fontSize:'0.95em', borderRadius:6, background:'#43c6ac', color:'#fff', border:'none', cursor:'pointer'}}
                              onClick={() => navigate(`/candidate/${c.id}`)}
                              type="button"
                            >
                              {t.viewProfile || 'View Profile'}
                            </button>
                            <button
                              onClick={() => handleVote(c.id, role)}
                              disabled={votedForThisRole || votingRole === role || !(election && new Date(election.startDate) <= new Date() && new Date() <= new Date(election.endDate))}
                              style={{
                                padding:'6px 16px', fontSize:'0.95em', borderRadius:6, background:(election && new Date(election.startDate) <= new Date() && new Date() <= new Date(election.endDate)) ? '#191654' : '#aaa', color:'#fff', border:'none', cursor:(election && new Date(election.startDate) <= new Date() && new Date() <= new Date(election.endDate)) ? 'pointer' : 'not-allowed'
                              }}
                            >
                              {(election && !(new Date(election.startDate) <= new Date() && new Date() <= new Date(election.endDate))) ? (t.votingClosed || 'Voting Closed') : (votedForThisRole ? (t.voted || 'Voted') : (votingRole === role ? (t.voting || 'Voting...') : (t.vote || 'Vote')))}
                            </button>
                          </div>
                        </div>
                        {isAdmin && (
                          <button style={{background:'#e74c3c',color:'#fff',marginLeft:8,minWidth:70}} onClick={() => handleDelete(c.id)} disabled={deleting===c.id}>
                            {deleting===c.id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {votedForThisRole && <p className="green">{t.alreadyVotedForRole ? t.alreadyVotedForRole.replace('{role}', role) : `You have already voted for ${role}.`}</p>}
              </div>
            );
          })}
      </>
    </div>

  );
}

export default Vote;
