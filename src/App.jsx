import React, { useState } from "react";
import LandingPage from "./components/auth/LandingPage.jsx";
import LoginModal from "./components/auth/LoginModal.jsx";
import Dashboard from "./components/dashboard/Dashboard.jsx";

// ─── ROOT APPLICATION ────────────────────────────────────────────────────────
function App() {
  const [auth, setAuth] = useState(null);

  if (!auth) {
    return (
      <LandingPage
        onLogin={() => setAuth({ username: "admin", role: "Engineer" })}
      />
    );
  }

  return (
    <Dashboard
      user={auth}
      onLogout={() => setAuth(null)}
    />
  );
}

export default App;
