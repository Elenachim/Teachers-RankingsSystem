import React from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import { Link } from "react-router-dom";

function MainPage() {
  return (
    <div className="text-dark">
      <Header />

      {/* Ενότητα Hero */}
      <section className="hero bg-primary bg-gradient-to-r from-blue-600 to-blue-800 text-white py-5">
        <div className="container position-relative" style={{ zIndex: 1 }}>
          <div className="row align-items-center">
            <div className="col-lg-12 text-center mb-4 mb-lg-0">
              <span className="badge bg-white text-primary px-3 py-2 rounded-pill mb-0">
                Σύστημα Παρακολούθησης Κατάταξης Εκπαιδευτικών
              </span>
            </div>
          </div>
        </div>
        <div className="container text-center">
          <h1 className="display-4 fw-bold text-light mt-0 pt-3">
            Παρακολουθήστε την Κατάταξή σας
          </h1>
          <p className="lead text-light">
            Παρακολουθήστε την κατάταξή σας στις λίστες διοριστέων και μείνετε
            ενημερωμένοι για τις εξελίξεις στον τομέα σας.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-4 mt-5">
            <Link
              to="/track-myself"
              className="btn btn-outline-light rounded-pill shadow px-4 py-2 d-flex align-items-center"
            >
              <i className="bi bi-graph-up me-2"></i>
              Παρακολούθηση Θέσης
            </Link>
            <Link
              to="/signup"
              className="btn btn-outline-light rounded-pill shadow px-4 py-2 d-flex align-items-center"
            >
              <i className="bi bi-person-plus me-2"></i>
              Εγγραφή
            </Link>
          </div>
        </div>
      </section>

      {/* Ενότητα "Πώς Λειτουργεί" */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center fw-bold mb-5">Πώς Λειτουργεί</h2>
          <div className="row g-4">
            {[
              {
                step: "1",
                title: "Δημιουργία Προφίλ",
                description:
                  "Προσθέστε τα στοιχεία σας και δημιουργήστε το προφίλ σας.",
              },
              {
                step: "2",
                title: "Παρακολούθηση Θέσης",
                description:
                  "Δείτε τη θέση σας στις λίστες διοριστέων τη θέση σας στις λίστες διοριστέων με απλότητα και ταχύτητα",
              },
              {
                step: "3",
                title: "Λήψη Ενημερώσεων",
                description: "Λάβετε ειδοποιήσεις όταν η οι λίστες και η θέση σας αλλάξουν.",
              },
            ].map((item, index) => (
              <div className="col-md-4" key={index}>
                <div className="card h-100 border-0 shadow rounded-4 text-center">
                  <div className="card-body">
                    <div className="display-4 text-primary fw-bold mb-3">
                      {item.step}
                    </div>
                    <h4 className="fw-semibold">{item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Κατάταξή σας στις Λίστες */}
      <section className="py-5 bg-dark text-white">
        <div className="container text-center">
          <h2 className="fw-bold mb-4">
            Θέλετε να δείτε την κατάταξή σας στις λίστες;
          </h2>
          <p className="lead mb-4">
            Ελέγξτε τη θέση σας οποιαδήποτε στιγμή με ένα μόνο κλικ!
          </p>
          <Link
            to="/rankinglist"
            className="btn btn-outline-light btn-lg rounded-pill shadow px-5"
          >
            Δείτε τις Λίστες Κατάταξης
            <i className="bi bi-list-stars ms-2"></i>
          </Link>
        </div>
      </section>

      {/* Ενότητα Χαρακτηριστικών */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center fw-bold mb-5">Βασικά Χαρακτηριστικά</h2>
          <div className="row g-4">
            {[
              {
                icon: "bi bi-graph-up-arrow",
                title: "Παρακολούθηση Θέσης",
                description:
                  "Παρακολουθήστε την τρέχουσα θέση σας και τις αλλαγές άμεσα",
              },
              {
                icon: "bi bi-bell",
                title: "Έξυπνες Ειδοποιήσεις",
                description:
                  "Λάβετε άμεσες ειδοποιήσεις για αλλαγές θέσης και νέες ευκαιρίες",
              },
              {
                icon: "bi bi-pie-chart",
                title: "Πίνακας Αναλυτικών Στοιχείων",
                description:
                  "Οπτικοποιήστε την πρόοδό σας και εντοπίστε τομείς βελτίωσης",
              },
              {
                icon: "bi bi-shield-check",
                title: "Ασφάλεια & Προστασία",
                description:
                  "Τα δεδομένα σας προστατεύονται με υψηλά πρότυπα ασφαλείας",
              },
            ].map((feature, index) => (
              <div className="col-md-6 col-lg-3" key={index}>
                <div className="card h-100 border-0 shadow-sm rounded-4 text-center p-3">
                  <div className="card-body">
                    <i
                      className={`${feature.icon} display-4 text-primary mb-3`}
                    ></i>
                    <h4 className="fw-semibold h5">{feature.title}</h4>
                    <p className="text-muted mb-0">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-5">
            <Link
              to="/track-myself"
              className="btn btn-primary btn-lg rounded-pill shadow px-5"
            >
              Ξεκινήστε Τώρα
              <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default MainPage;
