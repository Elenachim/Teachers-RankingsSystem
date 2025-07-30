import React, { useState } from "react";

function TeacherRanking() {
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterSchool, setFilterSchool] = useState("all");

  return (
    <div className="container py-5">
      <h2 className="mb-4">Teacher Rankings</h2>

      <div className="row mb-4">
        <div className="col-md-3">
          <select
            className="form-select"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
          >
            <option value="all">All Subjects</option>
            <option value="math">Mathematics</option>
            <option value="science">Science</option>
            <option value="english">English</option>
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={filterSchool}
            onChange={(e) => setFilterSchool(e.target.value)}
          >
            <option value="all">All Schools</option>
            <option value="school1">School 1</option>
            <option value="school2">School 2</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-primary">
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Subject</th>
              <th>Experience</th>
              <th>Qualifications</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {/* Add sample data - replace with real data from API */}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TeacherRanking;
