import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { auth, firestore } from "../firebase";
import { uploadToCloudinary } from "../cloudinary";
import { deleteDoc, doc, addDoc, collection, getDoc, getDocs, serverTimestamp } from "firebase/firestore";


const AdminDashboard = () => {
  // Real-time status update clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10000); // update every 10 seconds
    return () => clearInterval(interval);
  }, []);
  // Fetch all candidates
  const fetchCandidates = async () => {
    setCandidatesLoading(true);
    const querySnapshot = await getDocs(collection(firestore, "candidates"));
    setCandidates(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setCandidatesLoading(false);
  };
const [candidate, setCandidate] = useState({ name: "", grade: "", platforms: "", role: "", strand: "", image: "" });
const [imageUploading, setImageUploading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [election, setElection] = useState({ title: "", startDate: "", startTime: "", endDate: "", endTime: "" });
  const [electionMsg, setElectionMsg] = useState("");
  const [electionLoading, setElectionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("event");
  const [elections, setElections] = useState([]);
  const [electionsLoading, setElectionsLoading] = useState(true);
  const navigate = useNavigate();


  // Check admin role and fetch data
  useEffect(() => {
    let ignore = false;
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        if (!ignore) navigate("/");
        setAuthLoading(false);
        return;
      }
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (!userDoc.exists() || userDoc.data().role !== "admin") {
        if (!ignore) navigate("/");
      } else {
        fetchElections();
        fetchCandidates();
      }
      setAuthLoading(false);
    });
    return () => {
      ignore = true;
      unsubscribe();
    };
    // eslint-disable-next-line
  }, []);
  // Fetch all elections
  const fetchElections = async () => {
    setElectionsLoading(true);
    const querySnapshot = await getDocs(collection(firestore, "elections"));
  const electionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log('Fetched elections:', electionsData);
  setElections(electionsData);
    setElectionsLoading(false);
  };

  // Delete election event
  const handleDeleteElection = async (id) => {
    if (!window.confirm("Are you sure you want to delete this election event?")) return;
    try {
      const docRef = doc(firestore, "elections", id);
      await deleteDoc(docRef);
      setElections(elections.filter(e => e.id !== id));
      setElectionMsg("Election event deleted.");
    } catch (err) {
      setElectionMsg("Failed to delete election event.");
    }
  };

  // Delete candidate
  const handleDeleteCandidate = async (id) => {
    if (!window.confirm("Are you sure you want to delete this candidate?")) return;
    try {
      await deleteDoc(doc(firestore, "candidates", id));
      setCandidates(candidates.filter(c => c.id !== id));
    } catch (err) {
      setError("Failed to delete candidate.");
    }
  };
  // Handle input changes
const handleChange = (e) => {
  const { name, value } = e.target;
  setCandidate({ ...candidate, [name]: value });
};

const handleImageChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setImageUploading(true);
  try {
    const url = await uploadToCloudinary(file);
    setCandidate((prev) => ({ ...prev, image: url }));
  } catch (err) {
    setError("Image upload failed. Please try again.");
  }
  setImageUploading(false);
};
  const handleElectionChange = (e) => {
    const { name, value } = e.target;
    setElection({ ...election, [name]: value });
  };
  // Add candidate
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await addDoc(collection(firestore, "candidates"), {
        name: candidate.name,
        grade: candidate.grade,
        platforms: candidate.platforms,
        role: candidate.role,
        strand: candidate.strand,
        image: candidate.image || "",
        votes: 0
      });
      setCandidate({ name: "", grade: "", platforms: "", role: "", strand: "", image: "" });
      fetchCandidates();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };
  // Create election
  const handleCreateElection = async (e) => {
    e.preventDefault();
    setElectionMsg("");
    setElectionLoading(true);
    try {
      // Combine date and time into ISO strings for start and end
      const startISO = election.startDate && election.startTime ? new Date(`${election.startDate}T${election.startTime}`).toISOString() : "";
      const endISO = election.endDate && election.endTime ? new Date(`${election.endDate}T${election.endTime}`).toISOString() : "";
      await addDoc(collection(firestore, "elections"), {
        title: election.title,
        startDate: startISO,
        endDate: endISO,
        createdAt: new Date().toISOString(),
        status: "upcoming"
      });
      // Notify students: Election will start
      try {
        await addDoc(collection(firestore, "notifications"), {
          title: "Election Scheduled",
          body: `The student election "${election.title}" will start on ${election.startDate} at ${election.startTime}.`,
          timestamp: serverTimestamp(),
          forAll: true,
          type: "election_will_start"
        });
      } catch (notifErr) {
        console.error('Failed to create notification:', notifErr);
      }
      setElection({ title: "", startDate: "", startTime: "", endDate: "", endTime: "" });
      setElectionMsg("Election event created successfully!");
      fetchElections(); // Ensure the list is refreshed after creation
    } catch (err) {
      setElectionMsg("Failed to create election event.");
    }
    setElectionLoading(false);
  };
  // Update election status (start, end, results)
  // handleUpdateElectionStatus removed (unused)

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-blue-600 text-lg font-semibold">Loading...</div>
      </div>
    );
  }
  return (
    <div className="admin-dashboard min-h-screen bg-gray-50 py-8">
      <h2 className="text-2xl font-bold text-center mb-8">Admin Dashboard</h2>
  {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', borderRadius: 12, boxShadow: '0 2px 8px #2d6cdf11', overflow: 'hidden', border: '1px solid #b3c6e6', background: 'transparent' }}>
          <button
            style={{ minWidth: 180, padding: '12px 0', fontWeight: 600, fontSize: 16, border: 'none', outline: 'none', background: activeTab === 'event' ? '#e3f0fc' : '#fff', color: activeTab === 'event' ? '#1565c0' : '#555', borderBottom: activeTab === 'event' ? '3px solid #1976d2' : '3px solid transparent', transition: 'all 0.2s', marginRight: 2, cursor: 'pointer' }}
            onClick={() => setActiveTab('event')}
          >
            Create Event
          </button>
          <button
            style={{ minWidth: 180, padding: '12px 0', fontWeight: 600, fontSize: 16, border: 'none', outline: 'none', background: activeTab === 'candidate' ? '#e3f0fc' : '#fff', color: activeTab === 'candidate' ? '#1565c0' : '#555', borderBottom: activeTab === 'candidate' ? '3px solid #1976d2' : '3px solid transparent', transition: 'all 0.2s', marginLeft: 2, cursor: 'pointer' }}
            onClick={() => setActiveTab('candidate')}
          >
            Add Candidate
          </button>
        </div>
      </div>
      {/* Tab Content */}
      <div className="flex justify-center">
        {activeTab === 'event' && (
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-lg font-semibold mb-4 text-blue-700">Create Election Event</h3>
            <form onSubmit={handleCreateElection}>
              <input
                name="title"
                placeholder="Election Title"
                value={election.title}
                onChange={handleElectionChange}
                required
                className="w-full mb-4 px-4 py-2 text-base border border-blue-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-200 outline-none"
              />
              <div className="flex gap-2 mb-4">
                <input
                  name="startDate"
                  type="date"
                  value={election.startDate}
                  onChange={handleElectionChange}
                  required
                  className="flex-1 px-4 py-2 border border-blue-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-200 outline-none"
                />
                <input
                  name="startTime"
                  type="time"
                  value={election.startTime}
                  onChange={handleElectionChange}
                  required
                  className="flex-1 px-4 py-2 border border-blue-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-200 outline-none"
                />
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  name="endDate"
                  type="date"
                  value={election.endDate}
                  onChange={handleElectionChange}
                  required
                  className="flex-1 px-4 py-2 border border-blue-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-200 outline-none"
                />
                <input
                  name="endTime"
                  type="time"
                  value={election.endTime}
                  onChange={handleElectionChange}
                  required
                  className="flex-1 px-4 py-2 border border-blue-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-200 outline-none"
                />
              </div>
              <button type="submit" disabled={electionLoading} className="w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
                {electionLoading ? "Creating..." : "Create"}
              </button>
              {electionMsg && (
                <div className={
                  'mt-3 text-center ' + (electionMsg.includes('success') ? 'text-green-600' : 'text-red-600')
                }>
                  {electionMsg}
                </div>
              )}
            </form>
            {/* Election Events List */}
            <div className="mt-8">
              <h4 className="text-md font-semibold mb-2 text-blue-700">Election Events List</h4>
              {electionsLoading ? (
                <div className="text-center text-gray-500">Loading events...</div>
              ) : elections.length === 0 ? (
                <div className="text-center text-gray-500">No election events found.</div>
              ) : (
                <ul>
                  {elections.map(e => (
                    <li key={e.id} className="mb-3 p-3 bg-gray-100 rounded shadow flex items-center" style={{ position: 'relative' }}>
                      <div style={{ flex: 1 }}>
                        <div className="font-bold">{e.title}</div>
                        <div className="text-gray-700 text-sm">
                          {e.startDate && e.endDate ?
                            (new Date(e.startDate).toLocaleString() + ' to ' + new Date(e.endDate).toLocaleString())
                            : "No time set"}
                        </div>
                        <div className="text-xs text-gray-400">
                          Status: {(() => {
                            const start = e.startDate ? new Date(e.startDate) : null;
                            const end = e.endDate ? new Date(e.endDate) : null;
                            if (start && end) {
                              if (now < start) return "Upcoming";
                              if (now >= start && now <= end) return "Started";
                              if (now > end) return "Ended";
                            }
                            return e.status || "Unknown";
                          })()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteElection(e.id)}
                        className="px-3 py-1 rounded bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                        style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        {activeTab === 'candidate' && (
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-lg font-semibold mb-4 text-blue-700">Add Candidate</h3>
            <form onSubmit={handleSubmit}>
              <input
                name="name"
                placeholder="Candidate Name"
                value={candidate.name}
                onChange={handleChange}
                required
                className="w-full mb-4 px-4 py-2 border border-blue-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-200 outline-none"
              />
              <select
                name="role"
                value={candidate.role}
                onChange={handleChange}
                required
                className="w-full mb-4 px-4 py-2 border border-blue-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-200 outline-none"
                style={{ fontSize: 16 }}
              >
                <option value="" disabled>Select Role</option>
                <option value="president">President</option>
                <option value="vice president">Vice President</option>
                <option value="secretary">Secretary</option>
                <option value="treasurer">Treasurer</option>
                <option value="auditor">Auditor</option>
                <option value="P.I.O">P.I.O</option>
                <option value="peace officer">Peace Officer</option>
                <option value="grade 11 representative">Grade 11 Representative</option>
                <option value="grade 12 representative">Grade 12 Representative</option>
              </select>
              <select
                name="grade"
                value={candidate.grade}
                onChange={handleChange}
                required
                className="w-full mb-4 px-4 py-2 border border-blue-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-200 outline-none"
                style={{ fontSize: 16 }}
              >
                <option value="" disabled>Select Grade Level</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>

              <select
                name="strand"
                value={candidate.strand}
                onChange={handleChange}
                required
                className="w-full mb-4 px-4 py-2 border border-blue-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-200 outline-none"
                style={{ fontSize: 16 }}
              >
                <option value="" disabled>Select Strand</option>
                <option value="ict programming">ICT Programming</option>
                <option value="ict animation">ICT Animation</option>
                <option value="stem">STEM</option>
                <option value="abm">ABM</option>
                <option value="humss">HUMSS</option>
              </select>
              <textarea
                name="platforms"
                placeholder="Platforms (e.g. What will you do if elected?)"
                value={candidate.platforms}
                onChange={handleChange}
                required
                rows={2}
                className="w-full mb-4 px-4 py-2 border border-blue-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-200 outline-none resize-vertical"
              />
              <div className="mb-4">
                <label className="block mb-1 font-medium">Candidate Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-shrink-0"
                    disabled={imageUploading}
                  />
                  {candidate.image && (
                    <img src={candidate.image} alt="Preview" className="rounded shadow max-h-24 max-w-[96px] object-cover border border-blue-200" />
                  )}
                </div>
                {imageUploading && <div className="text-blue-600 text-sm mt-1">Uploading image...</div>}
              </div>
              <button type="submit" disabled={loading || imageUploading} className="w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
                {loading ? "Adding..." : "Add Candidate"}
              </button>
              {error && <p className="red mt-3 text-center text-red-600">{error}</p>}
            </form>
            {/* Candidates List (below form) */}
            <div className="mt-8">
              <h4 className="text-md font-semibold mb-2 text-blue-700">Candidates List</h4>
              {candidatesLoading ? (
                <div className="text-center text-gray-500">Loading candidates...</div>
              ) : candidates.length === 0 ? (
                <div className="text-center text-gray-500">No candidates found.</div>
              ) : (
                <ul>
                  {/* Candidate sorting and rendering */}
                  {(() => {
                    const roleOrder = [
                      'president',
                      'vice president',
                      'secretary',
                      'treasurer',
                      'auditor',
                      'P.I.O',
                      'peace officer',
                      'grade 11 representative',
                      'grade 12 representative',
                    ];
                    const sorted = [...candidates].sort((a, b) => {
                      const aIdx = roleOrder.findIndex(r => r.toLowerCase() === (a.role || '').toLowerCase());
                      const bIdx = roleOrder.findIndex(r => r.toLowerCase() === (b.role || '').toLowerCase());
                      if (aIdx === -1 && bIdx === -1) return 0;
                      if (aIdx === -1) return 1;
                      if (bIdx === -1) return -1;
                      return aIdx - bIdx;
                    });
                    return (
                      <>
                        {sorted.map(c => (
                          <li key={c.id} className="mb-3 p-3 bg-gray-100 rounded shadow flex items-center" style={{ position: 'relative' }}>
                            <div style={{ flex: 1 }}>
                              <div className="font-bold">{c.name}</div>
                              {/* Description removed from candidate list */}
                              <div className="text-xs text-gray-500">Role: {c.role}</div>
                              <div className="text-xs text-gray-500">Grade: {c.grade}</div>
                              <div className="text-xs text-gray-500">Strand: {c.strand}</div>
                              <div className="text-xs text-gray-500">Platforms: {c.platforms}</div>
                            </div>
                            <button
                              onClick={() => handleDeleteCandidate(c.id)}
                              className="px-3 py-1 rounded bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                              style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}
                            >
                              Delete
                            </button>
                          </li>
                        ))}
                      </>
                    );
                  })()}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default AdminDashboard;
