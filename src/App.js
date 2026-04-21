import { useState } from "react";
import NGODashboard from "./NGODashboard";
import VolunteerApp from "./VolunteerApp";

export default function App() {
  const [view, setView] = useState("ngo");

  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "center", gap: "12px",
        padding: "10px", background: "#070d1a",
        borderBottom: "1px solid #1f2d45",
        position: "sticky", top: 0, zIndex: 9999,
      }}>
        <button
          onClick={() => setView("ngo")}
          style={{
            padding: "6px 20px", borderRadius: "20px", border: "1px solid",
            fontFamily: "monospace", fontSize: "0.72rem", cursor: "pointer",
            borderColor: view === "ngo" ? "#38bdf8" : "#1f2d45",
            background: view === "ngo" ? "#38bdf811" : "transparent",
            color: view === "ngo" ? "#38bdf8" : "#64748b",
          }}
        >
          NGO Dashboard
        </button>
        <button
          onClick={() => setView("volunteer")}
          style={{
            padding: "6px 20px", borderRadius: "20px", border: "1px solid",
            fontFamily: "monospace", fontSize: "0.72rem", cursor: "pointer",
            borderColor: view === "volunteer" ? "#38bdf8" : "#1f2d45",
            background: view === "volunteer" ? "#38bdf811" : "transparent",
            color: view === "volunteer" ? "#38bdf8" : "#64748b",
          }}
        >
          Volunteer App
        </button>
      </div>
      {view === "ngo"       && <NGODashboard />}
      {view === "volunteer" && <VolunteerApp />}
    </div>
  );
}
