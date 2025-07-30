import React, { useState, useEffect } from 'react';
import { BACKEND_ROUTES_API } from "../../config/config";

const ChooseNotifications = () => {
  const [notifications, setNotifications] = useState({
    UpdatedSelfPosition: true,
    UpdatedTrackedPosition: true,
    NewList: true,
    CustomEmail: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      const response = await fetch(BACKEND_ROUTES_API + "GetNotificationPreferences.php", {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        console.log("Data: ", data.data);
        // Create a new notifications object with all values set to true initially
        const updatedNotifications = { ...notifications };

        // Set to false only the notifications that exist in data.data array
        data.data.forEach(notificationType => {
          if (notificationType in updatedNotifications) {
            updatedNotifications[notificationType] = false;
          }
        });

        setNotifications(updatedNotifications);
      }
    } catch (error) {
      console.error('Δεδομένα απάντησης:', error);
    }
  };

  const handleToggle = async (key) => {
    setIsSaving(true);
    setSaveStatus('Αποθήκευση...');

    try {
      const response = await fetch(BACKEND_ROUTES_API + "UpdateNotificationPreferences.php", {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationType: key,
          enabled: !notifications[key]
        })
      });

      const data = await response.json();
      console.log(data);
      if (data.success) {
        setNotifications(prev => ({
          ...prev,
          [key]: !prev[key]
        }));
        setSaveStatus('Επιτυχής αποθήκευση!');
      } else {
        setSaveStatus('Αποτυχία αποθήκευσης');
      }
    } catch (error) {
      console.error('Αποτυχία ενημέρωσης προτιμήσεων:', error);
      setSaveStatus('Αποτυχία αποθήκευσης');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <div
          className="d-flex justify-content-between align-items-center mb-4"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: 'pointer' }}
        >
          <h4 className="card-title mb-0">
            <i className="bi me-2 text-primary"></i>
            Προτιμήσεις Ειδοποιήσεων
          </h4>
          <div className="d-flex align-items-center" style={{ minWidth: '120px', justifyContent: 'flex-end' }}>
            <span className={`badge me-2 ${!saveStatus && 'invisible'} ${saveStatus.includes('Failed') ? 'bg-danger' : 'bg-success'}`}>
              {saveStatus || 'placeholder'}
            </span>
            <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
          </div>
        </div>

        {isExpanded && (
          <div className="notification-options">
            <div className="notification-item d-flex align-items-center justify-content-between p-3 border-bottom">
              <div>
                <h6 className="mb-1">Ενημέρωση Προσωπικής Θέσης</h6>
                <p className="text-muted small mb-0">
                  Ενημερώσεις για την τρέχουσα θέση σας
                </p>
              </div>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="UpdatedSelfPosition"
                  checked={notifications.UpdatedSelfPosition}
                  onChange={() => handleToggle('UpdatedSelfPosition')}
                  disabled={isSaving}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="notification-item d-flex align-items-center justify-content-between p-3 border-bottom">
              <div>
                <h6 className="mb-1">Ενημέρωση Θέσης Άλλων</h6>
                <p className="text-muted small mb-0">
                  Ενημερώσεις για τις θέσεις άλλων εκπαιδευτικών
                </p>
              </div>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="UpdatedTrackedPosition"
                  checked={notifications.UpdatedTrackedPosition}
                  onChange={() => handleToggle('UpdatedTrackedPosition')}
                  disabled={isSaving}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="notification-item d-flex align-items-center justify-content-between p-3 border-bottom">
              <div>
                <h6 className="mb-1">Νέες Λίστες</h6>
                <p className="text-muted small mb-0">
                  Λάβετε ειδοποίηση κάθε φορά που δημοσιεύεται μια νέα λίστα
                </p>
              </div>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="NewList"
                  checked={notifications.NewList}
                  onChange={() => handleToggle('NewList')}
                  disabled={isSaving}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="notification-item d-flex align-items-center justify-content-between p-3 border-bottom">
              <div>
                <h6 className="mb-1">Ανακοινώσεις Συστήματος</h6>
                <p className="text-muted small mb-0">
                  Σημαντικές ενημερώσεις και ανακοινώσεις συστήματος
                </p>
              </div>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="CustomEmail"
                  checked={notifications.CustomEmail}
                  onChange={() => handleToggle('CustomEmail')}
                  disabled={isSaving}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChooseNotifications;