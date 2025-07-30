import React, { useState, useEffect } from "react";
import { Navbar, Nav, Button, Offcanvas } from "react-bootstrap";
import { Link } from "react-router-dom";
import { BACKEND_ROUTES_API } from "../config/config";
import '../styles/style.css';
//import Logo from './Logo';

const AdminSidebar = () => {
  const [show, setShow] = useState(false);
  const toggleSidebar = () => setShow(!show);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPrivileges, setUserPrivileges] = useState("loggedout");

  const isAdmin = () => userPrivileges === "admin";

  useEffect(() => {
    checkEmployeeStatus();
  }, []);

  const checkEmployeeStatus = async () => {
    try {
      const response = await fetch(BACKEND_ROUTES_API + "VerifyPrivilage.php", {
        credentials: "include",
      });
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

  return (
    <>
      {/* Mobile Navbar Toggle */}
      <Navbar bg="primary" variant="dark" expand="xl" className="d-xl-none px-3">
        <Button variant="light" onClick={toggleSidebar} className="me-2">
          ☰
        </Button>
        {/* <Logo height="40px" className="mx-auto" /> */}
      </Navbar>

      {/* Offcanvas Sidebar for Mobile */}
      <Offcanvas show={show} onHide={toggleSidebar} responsive="xl" className="bg-primary text-white d-xl-none">
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title>Διαχειριστικό Πάνελ</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            {/* Σειρά: Αρχική, Κρατήσεις, Χρήστες (μόνο για διαχειριστές), Πρόγραμμα, Υπηρεσίες, Προσφορές, Popup, Προωθήσεις (μόνο για διαχειριστές), Γκαλερί, Αναφορές, Ρυθμίσεις (μόνο για διαχειριστές) */}
            <Nav.Link as={Link} to="/" className="text-white nav-link-custom d-flex align-items-center">
              <i className="bi bi-house-door-fill me-2"></i>
              Αρχική
            </Nav.Link>

            <Nav.Link as={Link} to="../../admin/apimanagement" className="text-white nav-link-custom d-flex align-items-center">
              <i className="bi bi-key-fill me-2"></i>
              Διαχείριση API
            </Nav.Link>

            {isAdmin() && (
              <Nav.Link as={Link} to="../../admin/Users" className="text-white nav-link-custom">
                <i className="bi bi-person-badge-fill me-2"></i>
                Χρήστες
              </Nav.Link>
            )}

            <Nav.Link as={Link} to="../../employees/categories" className="text-white nav-link-custom">
              <i className="bi bi-tags-fill me-2"></i>
              Κατηγορίες
            </Nav.Link>


            {isAdmin() && (
              <Nav.Link as={Link} to="../../admin/settings" className="text-white nav-link-custom">
                <i className="bi bi-gear-fill me-2"></i>
                Ρυθμίσεις
              </Nav.Link>
            )}
            <Nav.Link as={Link} to="../../employees/customemail" className="text-white nav-link-custom">
              <i className="bi bi-envelope-fill me-2"></i>
              Aποστολή Email
            </Nav.Link>
          </Nav>
          <hr className="border-light" />
          <Nav className="text-center">
            <Nav.Link as={Link} to="/user/profile" className="text-white fw-bold nav-link-custom">
              Προφίλ Χρήστη
            </Nav.Link>
          </Nav>

        </Offcanvas.Body>
      </Offcanvas>

      {/* Permanent Sidebar for Desktop */}
      <div
        className="d-none d-xl-flex flex-column bg-primary text-white p-3"
        style={{ maxWidth: "200px", minHeight: "100vh", overflowY: "auto" }}
      >
        <div className="text-center mb-3">
          <h3 className="text-center h4">Διαχειριστικό Πάνελ</h3>
        </div>
        <hr className="border-light" />
        <Nav className="flex-column mt-3">
          <Nav.Link as={Link} to="/" className="text-white nav-link-custom d-flex align-items-center">
            <i className="bi bi-house-door-fill me-2"></i>
            Αρχική
          </Nav.Link>

          <Nav.Link as={Link} to="../../admin/apimanagement" className="text-white nav-link-custom d-flex align-items-center">
            <i className="bi bi-key-fill me-2"></i>
            Διαχείριση API
          </Nav.Link>

          {isAdmin() && (
            <Nav.Link as={Link} to="../../admin/Users" className="text-white nav-link-custom">
              <i className="bi bi-person-badge-fill me-2"></i>
              Χρήστες
            </Nav.Link>
          )}

          <Nav.Link as={Link} to="../../employees/categories" className="text-white  nav-link-custom">
            <i className="bi bi-tags-fill me-2"></i>
            Κατηγορίες
          </Nav.Link>


          <Nav.Link as={Link} to="../../employees/customemail" className="text-white nav-link-custom">
            <i className="bi bi-envelope-fill me-2"></i>
            Aποστολή Email
          </Nav.Link>
        </Nav>
        <hr className="border-light" />
        <Nav className="text-center">
          <Nav.Link as={Link} to="/user/profile" className="text-white fw-bold nav-link-custom">
            Προφίλ Χρήστη
          </Nav.Link>
        </Nav>
      </div>
    </>
  );
};

export default AdminSidebar;