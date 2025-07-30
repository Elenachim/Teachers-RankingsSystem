import React, { useState, useEffect } from "react";

export const DeleteModal = ({ show, selectedCount, onCancel, onConfirm }) => {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let timer;
    if (confirmed) {
      timer = setTimeout(() => {
        onCancel();  // close modal after 3 seconds
        setConfirmed(false); // reset confirmed state for next time
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [confirmed, onCancel]);

  if (!show) return null;

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm();
  };

  return (
    <>
      <div
        className={`modal fade ${show ? "show" : ""}`}
        style={{ display: show ? "block" : "none" }}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Επιβεβαίωση Διαγραφής</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onCancel}
                aria-label="Cancel delete"
                disabled={confirmed}
              ></button>
            </div>
            <div className="modal-body">
              <p>
                Είστε σίγουροι ότι θέλετε να διαγράψετε {selectedCount}{" "}
                {selectedCount === 1 ? "χρήστη" : "χρήστες"}?
              </p>
              <p className="text-danger">
                <small>Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.</small>
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={confirmed}>
                Ακύρωση
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirm}
                aria-label="Confirm delete"
                disabled={confirmed}
              >
                Διαγραφή
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default DeleteModal;
