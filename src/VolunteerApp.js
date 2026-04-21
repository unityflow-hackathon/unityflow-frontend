import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./VolunteerApp.css";

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API = "https://unityflow-backend.onrender.com";

// For demo purposes - volunteer is Arjun Sharma (id from seeded data)
// In real app this would come from auth
const DEMO_VOLUNTEER_NAME = "Arjun Sharma";

const SECTOR_ICONS = {
  "Flood Relief":  "🌊",
  "Healthcare":    "🏥",
  "Food & Hunger": "🍱",
  "Education":     "📚",
  "Women Safety":  "🛡️",
};

const URGENCY_COLOR = (u) => {
  if (u >= 4) return "#ef4444";
  if (u === 3) return "#f97316";
  return "#22c55e";
};

const TABS = ["Incoming", "Active", "History"];

export default function VolunteerApp() {
  const [tasks, setTasks]         = useState([]);
  const [activeTab, setActiveTab] = useState("Incoming");
  const [accepted, setAccepted]   = useState({});   // taskId -> true
  const [declined, setDeclined]   = useState({});   // taskId -> true
  const [completed, setCompleted] = useState({});   // taskId -> true
  const [notification, setNotification] = useState(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API}/api/tasks`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, []);

  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAccept = async (task) => {
    try {
      // Find volunteer id from name match in a real app
      // For demo we use a placeholder volunteer_id
      await fetch(`${API}/api/tasks/${task._id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteer_id: "demo" }),
      });
      setAccepted(prev => ({ ...prev, [task._id]: true }));
      showNotification(`Task accepted! Head to ${task.sector} location.`);
      setActiveTab("Active");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = (taskId) => {
    setDeclined(prev => ({ ...prev, [taskId]: true }));
    showNotification("Task declined.", "info");
  };

  const handleComplete = async (task) => {
    try {
      await fetch(`${API}/api/tasks/${task._id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      setCompleted(prev => ({ ...prev, [task._id]: true }));
      showNotification("Task marked complete! Great work 🎉");
      fetchTasks();
      setActiveTab("History");
    } catch (err) {
      console.error(err);
    }
  };

  // Filter tasks for each tab
  const incomingTasks = tasks.filter(t =>
    t.status === "open" && !accepted[t._id] && !declined[t._id]
  );
  const activeTasks = tasks.filter(t =>
    accepted[t._id] && !completed[t._id]
  );
  const historyTasks = tasks.filter(t =>
    completed[t._id] || t.status === "completed"
  );

  return (
    <div className="volunteer-app">
      {/* Notification toast */}
      {notification && (
        <div className={`toast toast-${notification.type}`}>
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className="vol-header">
        <div className="vol-avatar">{DEMO_VOLUNTEER_NAME[0]}</div>
        <div className="vol-info">
          <div className="vol-name">{DEMO_VOLUNTEER_NAME}</div>
          <div className="vol-status">
            <span className="status-dot-green" />
            Available
          </div>
        </div>
        <div className="vol-sector-badge">Flood Relief</div>
      </div>

      {/* Stats bar */}
      <div className="stats-bar">
        <div className="stat">
          <div className="stat-num">{incomingTasks.length}</div>
          <div className="stat-label">Incoming</div>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <div className="stat-num">{activeTasks.length}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <div className="stat-num">{Object.keys(completed).length}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="vol-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`vol-tab ${activeTab === tab ? "vol-tab-active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "Incoming" && incomingTasks.length > 0 && (
              <span className="tab-badge">{incomingTasks.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="vol-content">

        {/* INCOMING TAB */}
        {activeTab === "Incoming" && (
          <div className="task-feed">
            {incomingTasks.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">✓</div>
                <div>No incoming tasks right now</div>
              </div>
            )}
            {incomingTasks.map(task => (
              <div key={task._id} className="task-notification-card">
                <div className="notif-top">
                  <span className="notif-sector-icon">{SECTOR_ICONS[task.sector]}</span>
                  <div className="notif-sector">{task.sector}</div>
                  <div
                    className="notif-urgency"
                    style={{ background: URGENCY_COLOR(task.urgency) + "22", color: URGENCY_COLOR(task.urgency) }}
                  >
                    URGENCY {task.urgency}/5
                  </div>
                </div>
                <p className="notif-desc">{task.description}</p>
                <div className="notif-meta">
                  <span>📍 {task.latitude.toFixed(4)}, {task.longitude.toFixed(4)}</span>
                  <span>Reported by {task.reporter_name}</span>
                </div>
                <div className="notif-actions">
                  <button
                    className="btn-decline"
                    onClick={() => handleDecline(task._id)}
                  >
                    Decline
                  </button>
                  <button
                    className="btn-accept"
                    onClick={() => handleAccept(task)}
                  >
                    Accept Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACTIVE TAB */}
        {activeTab === "Active" && (
          <div className="task-feed">
            {activeTasks.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div>No active tasks</div>
              </div>
            )}
            {activeTasks.map(task => (
              <div key={task._id} className="active-task-card">
                <div className="active-task-header">
                  <span className="notif-sector-icon">{SECTOR_ICONS[task.sector]}</span>
                  <div>
                    <div className="active-task-sector">{task.sector}</div>
                    <div className="active-task-status">In Progress</div>
                  </div>
                  <div className="urgency-pill" style={{ background: URGENCY_COLOR(task.urgency) }}>
                    U{task.urgency}
                  </div>
                </div>

                <p className="notif-desc">{task.description}</p>

                {/* Mini map */}
                <div className="mini-map-wrapper">
                  <MapContainer
                    center={[task.latitude, task.longitude]}
                    zoom={14}
                    className="mini-map"
                    zoomControl={false}
                    dragging={false}
                    scrollWheelZoom={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[task.latitude, task.longitude]}>
                      <Popup>{task.sector}</Popup>
                    </Marker>
                  </MapContainer>
                </div>

                <a
                  className="directions-btn"
                  href={`https://maps.google.com/?q=${task.latitude},${task.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  📍 Open in Google Maps
                </a>

                <button
                  className="btn-complete"
                  onClick={() => handleComplete(task)}
                >
                  ✓ Mark Complete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "History" && (
          <div className="task-feed">
            {historyTasks.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📜</div>
                <div>No completed tasks yet</div>
              </div>
            )}
            {historyTasks.map(task => (
              <div key={task._id} className="history-card">
                <div className="history-top">
                  <span>{SECTOR_ICONS[task.sector]}</span>
                  <div className="history-sector">{task.sector}</div>
                  <div className="history-badge">✓ Done</div>
                </div>
                <p className="history-desc">{task.description}</p>
                <div className="history-meta">
                  {new Date(task.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric"
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
