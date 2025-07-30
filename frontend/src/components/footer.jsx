import React from "react";
import { Link } from "react-router-dom";
import { ReactComponent as InstagramIcon } from "../assets/icons/instagram.svg";
import { ReactComponent as FacebookIcon } from "../assets/icons/facebook.svg";


function Footer() {
  return (
    <footer className="mt-5 border-top">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-md-4 mb-3 mb-md-0 col-12 text-md-start text-center">
            <h5 className="text-primary mb-3">Γρήγορη Πλοήγηση</h5>
            <ul className="list-unstyled mb-0">
              <li className="mb-2">
                <Link to="/" className="text-muted text-decoration-none">
                  Αρχική
                </Link>
              </li>

              <li className="mb-2">
                <Link
                  to="/statistics"
                  className="text-muted text-decoration-none hover-primary"
                >
                  Στατιστικά
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/rankinglist"
                  className="text-muted text-decoration-none hover-primary"
                >
                  Λίστες Κατάταξης
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-md-4 mb-3 mb-md-0 col-12 text-md-start text-center">
            <h5 className="text-primary mb-3">Χρήσιμοι Σύνδεσμοι</h5>
            <ul className="list-unstyled mb-0">

              <li className="mb-2">
                <Link
                  to="/user/api"
                  className="text-muted text-decoration-none"
                >
                  Πρόσβαση σε API
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/user/profile" className="text-muted text-decoration-none">
                  Το Προφίλ μου
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/track-myself"
                  className="text-muted text-decoration-none"
                >
                  Παρακολούθηση Θέσης
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-md-4">
            <h5 className="text-primary mb-3 col-12 text-md-start text-center ">
              Επικοινωνήστε Μαζί Μας
            </h5>
            <div className="d-flex gap-3 justify-content-center justify-content-md-start align-items-center">
              <a
                href="mailto:teacherrankingcy@gmail.com"
                className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
                style={{ width: "40px", height: "40px" }}
              >
                <i className="bi bi-envelope" style={{ fontSize: "20px" }}></i>
              </a>
              <a
                href="mailto:email@email.com"
                className="text-muted ms-2"
                style={{ fontSize: "16px", textDecoration: "none" }}
              >
                email@email.com
              </a>
            </div>
          </div>




        </div>

        <div className="row mt-5">
          <div className="col-12 text-center">
            <p className="text-muted mb-0">
              © {new Date().getFullYear()} Σύστημα Παρακολούθησης Θέσεων
              Εκπαιδευτικών | Τεχνολογικό Πανεπιστήμιο Κύπρου
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
