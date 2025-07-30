import { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import helpData from "../config/helpData";

export default function HelpCenter() {
  const [show, setShow] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;
  const sortedPaths = Object.keys(helpData).sort((a, b) => b.length - a.length);
  const bestMatchPath = sortedPaths.find((path) =>
    currentPath.startsWith(path)
  );
  const helpItems = bestMatchPath ? helpData[bestMatchPath] : [];

  const handleLinkClick = (to) => {
    setShow(false);
    navigate(to);
  };

  if (helpItems.length === 0) return null;

  const help = helpItems[0];

  return (
    <>
      {/* Inline animation style */}
      <style>
        {`
                    .animated-modal .modal-content {
                        animation: fadeIn 0.4s ease-in-out;
                    }
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(-20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `}
      </style>

      <Button
        variant="light"
        size="lg"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          fontSize: "20px",
          backgroundColor: "#f0f0f0",
          color: "#333",
          border: "1px solid #ccc",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          zIndex: "9999",
          opacity: "0.85",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
        onClick={() => setShow(true)}
      >
        <strong>?</strong>
      </Button>

      <Modal
        show={show}
        onHide={() => setShow(false)}
        centered
        size="lg"
        dialogClassName="modal-dialog-scrollable animated-modal"
        style={{
          borderRadius: "20px",
          overflow: "hidden",
        }}
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: "#f8f9fa",
            borderBottom: "1px solid #dee2e6",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
          }}
        >
          <Modal.Title style={{ fontWeight: "600", fontSize: "1.25rem" }}>
            {help.title}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body
          style={{
            padding: "1.8rem",
            lineHeight: "1.7",
            backgroundColor: "#ffffff",
          }}
        >
          <h5 className="mb-3 text-primary" style={{ fontWeight: "600" }}>
            Τι μπορείτε να κάνετε:
          </h5>
          <p>{help.what}</p>

          {help.links && (
            <>
              <h5
                className="mt-4 mb-2 text-primary"
                style={{ fontWeight: "600" }}
              >
                Σημαντικές ενέργειες:
              </h5>
              <ul style={{ paddingLeft: "1rem" }}>
                {help.links.map((link, idx) => (
                  <li key={idx} style={{ marginBottom: "8px" }}>
                    <Button
                      variant="link"
                      style={{
                        textDecoration: "none",
                        fontWeight: "500",
                        color: "#0d6efd",
                        padding: "0",
                      }}
                      onClick={() => handleLinkClick(link.to)}
                    >
                      {link.name}
                    </Button>
                    : {link.description}
                  </li>
                ))}
              </ul>
            </>
          )}

          {help.actions && (
            <>
              <h5
                className="mt-4 mb-2 text-primary"
                style={{ fontWeight: "600" }}
              >
                Γρήγορες κινήσεις:
              </h5>
              <ul style={{ paddingLeft: "1rem" }}>
                {help.actions.map((action, idx) => (
                  <li key={idx} style={{ marginBottom: "8px" }}>
                    {action}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Modal.Body>

        <Modal.Footer
          style={{
            backgroundColor: "#f8f9fa",
            borderTop: "1px solid #dee2e6",
            borderBottomLeftRadius: "20px",
            borderBottomRightRadius: "20px",
            justifyContent: "flex-end",
          }}
        >
          <Button variant="outline-secondary" onClick={() => setShow(false)}>
            Κλείσιμο
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
