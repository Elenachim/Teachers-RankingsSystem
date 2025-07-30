import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/images/default-avatar.png";
import { BACKEND_ROUTES_API, BACKEND_IMAGES_URL } from '../config/config';
import '../styles/Header.css';
import Search from './Search';

function Header({ bg }) {
  const headerClass = bg ? "bg-primary shadow-sm" : "bg-white shadow-sm";
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [userPrivileges, setUserPrivileges] = useState('loggedout');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);




  // Set the margin-top of the body to 70px when the component mounts because the header is fixed
  useEffect(() => {
    document.body.style.marginTop = '70px';
    return () => {
      document.body.style.marginTop = '';
    };
  }, []);







  useEffect(() => {
    if (isLoggedIn) fetchUserData();
  }, [isLoggedIn]);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }

    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !event.target.closest('.toggle-menu-button')
      ) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const checkLoginStatus = async () => {
    try {
      const response = await fetch(BACKEND_ROUTES_API + "VerifyPrivilage.php", { credentials: "include" });
      const data = await response.json();
      if (data.privileges === "loggedout") {
        setIsLoggedIn(false);
      } else {
        setIsLoggedIn(data.success);
        setUserPrivileges(data.privileges);
      }
    } catch (error) {
      console.error("Έλεγχος σύνδεσης απέτυχε:", error);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch(BACKEND_ROUTES_API + "GetUserProfile.php", { credentials: "include" });
      const data = await response.json();
      if (data.success) {
        const baseUrl = BACKEND_IMAGES_URL;
        const userData = {
          ...data.user,
          profilePicture: data.user.profilePicture
            ? `${baseUrl}${data.user.profilePicture}`
            : null
        };
        setUserInfo(userData);
        if (userData.profilePicture) {
          localStorage.setItem('userProfilePicture', userData.profilePicture);
        }
      } else {
        console.error("Αποτυχία λήψης δεδομένων χρήστη:", data.message);
        if (data.message === "User not authenticated") {
          navigate("/login");
        }
      }
    } catch (error) {
      console.error("Αποτυχία λήψης δεδομένων χρήστη:", error);
    }
  };

  const handleProfileClick = () => navigate('/user/profile');
  const toggleMenu = () => setMenuOpen(prev => !prev);
  const isStaff = () => ['admin', 'employee'].includes(userPrivileges);

  return (
    <>
      <header className={`${headerClass} position-fixed top-0 w-100`} style={{ zIndex: 1050 }}>
        <nav className="navbar d-none d-xl-flex navbar-expand-md w-100 py-3">
          <div className="container d-flex justify-content-between align-items-center">
            <Link className="navbar-brand nav-link d-flex align-items-center gap-2" to="/">
              <i className="bi bi-mortarboard-fill text-primary"></i>
              <span className="fw-bold">Κατατάξεις Καθηγητών</span>
            </Link>
            <div className="d-flex align-items-center gap-4">
              <Link className="nav-link" to="/">Αρχική</Link>
              <Link className="nav-link" to="/track-myself">Παρακολούθηση Θέσης</Link>
              <Link className="nav-link" to="/statistics">Στατιστικά</Link>
              <Link className="nav-link" to="/rankinglist">Λίστες</Link>
              <button
  className="btn btn-outline-primary mx-0"
  onClick={() => setIsSearchOpen(true)}
  style={{ width: "35px", height: "35px", padding: 0, borderRadius: "50%" }}
>
  <i className="bi bi-search"></i>
</button>
              {isLoggedIn && isStaff() && (
                <Link to="/admin/Users" className="btn btn-light rounded-pill px-3 py-2 d-flex align-items-center gap-2 shadow-sm">
                  <i className="bi bi-speedometer2 text-primary"></i>
                  <span className="small fw-medium">Πίνακας Ελέγχου</span>
                </Link>
              )}
              {!isLoggedIn ? (
                <>
                  <Link className="btn btn-outline-primary rounded-pill px-3 py-2 small" to="/login">Σύνδεση</Link>
                  <Link className="btn btn-outline-primary rounded-pill px-3 py-2 small" to="/signup">Εγγραφή</Link>
                </>
              ) : (
                <div className="profile-container d-flex align-items-center" onClick={handleProfileClick}>
                  <img
                    src={userInfo.profilePicture || defaultAvatar}
                    alt="Προφίλ"
                    className="profile-image rounded-circle border border-2 border-primary"
                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                  />
                </div>
              )}


            </div>
          </div>
        </nav>

        {/* Mobile Header */}
        <div className="d-flex d-xl-none justify-content-between align-items-center p-3">
          <div className="d-flex hover-scale align-items-center gap-2">
            <Link className="navbar-brand hover-scale nav-link d-flex align-items-center gap-2" to="/">
              <i className="bi bi-mortarboard-fill text-primary"></i>
              <span className="fw-bold">Κατατάξεις Καθηγητών</span>
            </Link>
          </div>


          <span className="d-flex align-items-center gap-2">


          <button onClick={toggleMenu} className="btn btn-outline-primary rounded-circle toggle-menu-button d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
            <i className={menuOpen ? "bi bi-x" : "bi bi-list"}></i>
          </button>

</span>
        </div>
      </header>

      <div className="mobile-menu-container">
        <div ref={menuRef} className="mobile-menu p-4 w-100 mx-3">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div onClick={toggleMenu} className="d-flex hover-scale align-items-center gap-2">
              <Link className="navbar-brand nav-link d-flex align-items-center gap-2" to="/">
                <i className="bi bi-mortarboard-fill text-primary"></i>
                <span className="fw-bold">Κατατάξεις Καθηγητών</span>
              </Link>
            </div>
            <button onClick={toggleMenu} className="btn btn-light rounded-circle toggle-menu-button d-flex align-items-center justify-content-center close-button" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-x fs-4"></i>
            </button>
          </div>
          <nav className="d-flex flex-column gap-2">
            <Link className="mobile-nav-link d-flex align-items-center gap-2" to="/" onClick={toggleMenu}><i className="bi bi-house"></i><span>Αρχική</span></Link>
            <Link className="mobile-nav-link d-flex align-items-center gap-2" to="/track-myself" onClick={toggleMenu}><i className="bi bi-person-fill-gear"></i><span>Παρακολούθηση Θέσης</span></Link>
            <Link className="mobile-nav-link d-flex align-items-center gap-2" to="/statistics" onClick={toggleMenu}><i className="bi bi-graph-up"></i><span>Στατιστικά</span></Link>
            <Link className="mobile-nav-link d-flex align-items-center gap-2" to="/rankinglist" onClick={toggleMenu}>
  <i className="bi bi-card-checklist"></i>
  <span>Λίστες</span>
</Link>
<Link
  className="mobile-nav-link d-flex align-items-center gap-2"
  to=""
onClick={() => {
  setIsSearchOpen(true);
  toggleMenu();
}}

>
  <i className="bi bi-search"></i>
  <span>Αναζήτηση</span>
</Link>


            {isLoggedIn && isStaff() && (
              <Link className="mobile-nav-link d-flex align-items-center gap-2" to="/admin/Users" onClick={toggleMenu}><i className="bi bi-speedometer2"></i><span>Πίνακας Ελέγχου</span></Link>
            )}
            <hr className="my-4" />
            {!isLoggedIn ? (
              <div className="d-flex gap-2">
                <Link className="btn btn-outline-primary rounded-pill py-2 fw-medium" to="/login" onClick={toggleMenu}>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Σύνδεση
                </Link>
                <Link className="btn btn-outline-primary rounded-pill py-2 fw-medium" to="/signup" onClick={toggleMenu}>
                  <i className="bi bi-person-plus me-2"></i>
                  Εγγραφή
                </Link>
              </div>
            ) : (
              <Link className="mobile-nav-link d-flex align-items-center gap-2" to="/user/profile" onClick={toggleMenu}>
                <img
                  src={userInfo.profilePicture || defaultAvatar}
                  alt="Προφίλ"
                  className="rounded-circle border border-2 border-primary"
                  style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                />
                <span>Το Προφίλ Μου</span>
              </Link>
            )}
          </nav>
        </div>
      </div>

      <Search isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

export default Header;
