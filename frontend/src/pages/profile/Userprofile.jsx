import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BACKEND_ROUTES_API, BACKEND_IMAGES_URL } from "../../config/config";
import defaultAvatar from "../../assets/images/default-avatar.png";

import Header from "../../components/header";
import EditProfile from "./Editprofile";
import ChooseNotifications from "./ChooseNotifications";
import TrackedPersonsSection from "../../components/TrackedPersonsSection";
import MyTrackingDashboard from "../MyTrackingDashboard";

const UserProfile = () => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [userInfo, setUserInfo] = useState({ userId: "", name: "", email: "" });

  useEffect(() => {
    fetchUserData();
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${BACKEND_ROUTES_API}/GetUserProfile.php`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        const profilePicture = data.user.profilePicture
          ? `${BACKEND_IMAGES_URL}${data.user.profilePicture}`
          : null;
        setUserInfo({ ...data.user, profilePicture });
        if (profilePicture)
          localStorage.setItem("userProfilePicture", profilePicture);
      } else {
        if (data.message === "User not authenticated") navigate("/login");
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("profilePicture", file);

    try {
      const response = await fetch(
        `${BACKEND_ROUTES_API}/UploadProfilePicture.php`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );
      const data = await response.json();

      if (data.success) {
        setUserInfo((prev) => ({ ...prev, profilePicture: data.imageUrl }));
        window.location.reload();
      } else {
        showTemporaryError("Δεν ήταν δυνατή η μεταφόρτωση της εικόνας προφίλ");
      }
    } catch (error) {
      showTemporaryError("Δεν ήταν δυνατή η μεταφόρτωση της εικόνας προφίλ");
    } finally {
      setIsUploading(false);
    }
  };

  const showTemporaryError = (message) => {
    setUploadError(message);
    setTimeout(() => setUploadError(null), 3000);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${BACKEND_ROUTES_API}/Logout.php`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        localStorage.clear();
        sessionStorage.clear();
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <Header />

      {uploadError && (
        <div
          className="alert alert-danger d-flex align-items-center mx-4 mt-3"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{uploadError}</div>
          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setUploadError(null)}
          ></button>
        </div>
      )}

      <div className="container py-4" style={{ maxWidth: "920px" }}>
        {/* Actions */}

        {/* Profile Info */}
        <div className="card rounded-4 border-0 shadow-sm mb-4 mt-3 pe-md-5">
          <div className="card-body p-4 d-flex flex-column flex-md-row align-items-center position-relative">
            {/* Dropdown for md and above */}

            <div
              className="position-absolute d-none d-md-block"
              style={{ top: 16, right: -25, zIndex: 2 }}
            >
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                  type="button"
                  id="profileActionsDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ width: 40, height: 40, padding: 0 }}
                >
                  <i className="bi bi-three-dots fs-4"></i>
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end"
                  aria-labelledby="profileActionsDropdown"
                >
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => navigate("/user/changepassword")}
                    >
                      Αλλαγή Κωδικού
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={() => setShowLogoutModal(true)}
                    >
                      Αποσύνδεση
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Dropdown for sm and below */}
            <div
              className="position-absolute d-block d-md-none"
              style={{ top: 16, right: 16, zIndex: 2 }}
            >
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                  type="button"
                  id="profileActionsDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ width: 40, height: 40, padding: 0 }}
                >
                  <i className="bi bi-three-dots fs-4"></i>
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end"
                  aria-labelledby="profileActionsDropdown"
                >
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => navigate("/user/changepassword")}
                    >
                      Αλλαγή Κωδικού
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={() => setShowLogoutModal(true)}
                    >
                      Αποσύνδεση
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Profile  */}
            <div className="position-relative me-md-4 mb-3 mb-md-0">
              <img
                src={userInfo.profilePicture || defaultAvatar}
                alt="Profile"
                className={`rounded-circle border border-3 border-primary ${
                  isUploading ? "opacity-75" : ""
                }`}
                style={{ width: 100, height: 100, objectFit: "cover" }}
                onError={(e) => (e.target.src = defaultAvatar)}
              />
              <div
                className="position-absolute"
                style={{ right: -10, bottom: -10 }}
              >
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/png, image/jpeg"
                  onChange={handleProfilePictureUpload}
                  className="d-none"
                />
                <label
                  htmlFor="profilePicture"
                  className="btn btn-sm btn-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: 32, height: 32 }}
                >
                  {isUploading ? (
                    <div className="spinner-border spinner-border-sm"></div>
                  ) : (
                    <i className="bi bi-camera-fill"></i>
                  )}
                </label>
              </div>
            </div>
            <div className="text-center ">
              <EditProfile
                userData={{ userId: userInfo.userId, username: userInfo.name }}
                onSuccess={fetchUserData}
              />
              <p
                className="text-muted mb-0 text-md-start text-center"
                style={{ wordBreak: "break-all", whiteSpace: "normal" }}
              >
                <i className="bi bi-envelope-fill me-2"></i>
                {userInfo.email}
              </p>
              {/* Subtle Quick Links */}
              <div className="d-flex justify-content-md-start justify-content-center flex-wrap gap-2 mt-3">
                <button
                  className="btn btn-outline-secondary btn-sm rounded-pill"
                  onClick={() => navigate("/track-myself")}
                >
                  Η Θέση μου
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm rounded-pill"
                  onClick={() => navigate("/user/trackothers")}
                >
                  Παρακολούθηση Άλλων
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Ranking */}
        <div className="card rounded-4 border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <h5 className="fw-semibold mb-3">
              <i className="me-2 text-primary"></i>Η Κατάταξή μου{" "}
              <span className="text-muted">(τελευταία ενημέρωση)</span>
            </h5>
            <MyTrackingDashboard embedded={true} />
          </div>
        </div>

        {/* Tracked Persons */}
        <div className="card rounded-4 border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <TrackedPersonsSection />
          </div>
        </div>

        {/* Notifications */}
        <div className="card rounded-4 border-0 shadow-sm mb-5">
          <div className="card-body p-4">
            <ChooseNotifications />
          </div>
        </div>

        {/* Logout Modal */}
        {showLogoutModal && (
          <>
            <div className="modal show d-block" style={{ zIndex: 1050 }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content rounded-4">
                  <div className="modal-body text-center p-4">
                    <h5 className="mb-3">
                      Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε;
                    </h5>
                    <div className="mt-4">
                      <button
                        className="btn btn-outline-secondary me-2"
                        onClick={() => setShowLogoutModal(false)}
                      >
                        Ακύρωση
                      </button>
                      <button className="btn btn-danger" onClick={handleLogout}>
                        Αποσύνδεση
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="modal-backdrop show"
              style={{ zIndex: 1040 }}
              onClick={() => setShowLogoutModal(false)}
            ></div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
