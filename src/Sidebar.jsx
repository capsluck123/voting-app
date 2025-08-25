import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, firestore } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import './App.css';

const Sidebar = ({ onLogout, isAdmin: isAdminProp, onClose }) => {
  const location = useLocation();
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [notifCount, setNotifCount] = useState(0);
  const [showBadge, setShowBadge] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Always check Firestore for the latest role if logged in
    const fetchRole = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
            localStorage.setItem('role', userDoc.data().role);
          }
        } catch {}
      }
    };
    fetchRole();

    // Fetch notification count for badge and manage seen state
    const fetchNotifCount = async () => {
      try {
        const q = query(
          collection(firestore, 'notifications'),
          orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        const count = snap.size;
        setNotifCount(count);
        // Compare with last seen count in localStorage
        const lastSeen = parseInt(localStorage.getItem('notif_last_seen') || '0', 10);
        setShowBadge(count > lastSeen);
      } catch {
        setNotifCount(0);
        setShowBadge(false);
      }
    };
    fetchNotifCount();
  }, []);

  // Hide badge and update last seen count when visiting notifications
  const handleNotificationsClick = (e) => {
    setShowBadge(false);
    localStorage.setItem('notif_last_seen', notifCount.toString());
    navigate('/notifications');
  };

  const isAdmin = role === 'admin';
  const isStudent = role === 'student';

  // Close sidebar on mobile when a link is clicked
  const handleNavClick = () => {
    if (window.innerWidth <= 900 && onClose) {
      onClose();
    }
  };

  // Overlay for mobile
  return (
    <>
      {window.innerWidth <= 900 && (
        <div className="sidebar-overlay" onClick={onClose} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.18)',zIndex:99}}></div>
      )}
      <aside className="sidebar" style={window.innerWidth <= 900 ? {zIndex: 1000} : {}}>
        <div className="sidebar-header">
          {/* <h2>Menu</h2> */}
        </div>
        <nav>
          <ul>
          {isAdmin && (
            <>
              <li className={location.pathname === '/admin-dashboard' || location.pathname === '/admin' ? 'active' : ''}>
                <Link to="/admin-dashboard" onClick={handleNavClick}>Dashboard</Link>
              </li>
              <li className={location.pathname === '/candidate-profile' ? 'active' : ''}>
                <Link to="/candidate-profile" onClick={handleNavClick}>Vote Tally</Link>
              </li>
              <li className={location.pathname === '/student-approval' ? 'active' : ''}>
                <Link to="/student-approval" onClick={handleNavClick}>Student Approval</Link>
              </li>
              <li className={location.pathname === '/audit-log' ? 'active' : ''}>
                <Link to="/audit-log" onClick={handleNavClick}>Audit Log</Link>
              </li>
            </>
          )}
          {isStudent && (
            <>
              <li className={location.pathname === '/vote' ? 'active' : ''}>
                <Link to="/vote" onClick={handleNavClick} className="sidebar-link">
                  Election Poll
                </Link>
              </li>
              <li className={location.pathname === '/candidate-profile' ? 'active' : ''}>
                <Link to="/candidate-profile" onClick={handleNavClick} className="sidebar-link">
                  Vote Tally
                </Link>
              </li>
              <li className={location.pathname === '/results' ? 'active' : ''}>
                <Link to="/results" onClick={handleNavClick} className="sidebar-link">
                  Results
                </Link>
              </li>
              <li className={location.pathname === '/notifications' ? 'active' : ''}>
                <button
                  onClick={e => { handleNotificationsClick(e); handleNavClick(); }}
                  className="sidebar-link"
                  style={{
                    display:'flex',
                    alignItems:'center',
                    width:'100%',
                    padding:'8px 0 8px 18px',
                    textAlign:'left',
                    fontSize:'1.08em',
                    fontWeight:500,
                    border:'none',
                    background:'none',
                    color:'inherit',
                    cursor:'pointer',
                    borderRadius:'8px',
                    transition:'background 0.15s'
                  }}
                >
                  <span style={{flex:1}}>Notifications</span>
                  {showBadge && notifCount > 0 && (
                    <span style={{
                      position: 'relative',
                      marginLeft: 8,
                      background: 'red',
                      color: 'white',
                      borderRadius: '50%',
                      padding: '2px 7px',
                      fontSize: '0.85em',
                      fontWeight: 700,
                      minWidth: 22,
                      textAlign: 'center',
                      zIndex: 1,
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      top: 0
                    }}>{notifCount}</span>
                  )}
                </button>
              </li>
              <li className={location.pathname === '/settings' ? 'active' : ''}>
                <Link to="/settings" onClick={handleNavClick} className="sidebar-link">
                  Settings
                </Link>
              </li>
            </>
          )}
        </ul>
        </nav>
        <button className="sidebar-logout" onClick={() => { onLogout(); if (onClose) onClose(); }}>Log Out</button>
      </aside>
    </>
  );
};

export default Sidebar;
