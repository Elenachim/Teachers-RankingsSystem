import React, { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/backend/api/test.php") // Change this URL if needed
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch((error) => console.error("Error:", error));
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>React & PHP Connection Test</h1>
      <p>{message ? `Backend Response: ${message}` : "Loading..."}</p>
    </div>
  );
}

export default App;