import React, { useState, useEffect } from "react";
import axios from "axios";
import GuruHari from "../src/Images/Guruhari.png";
import Swamiji from "../src/Images/Swamiji.png";
import SaralMandal from "../src/Images/Saral-Logo.png";

import "./App.css";

const api = "http://localhost:4000/api";

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [user, setUser] = useState(null); // { username, token }
  const [error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (username, password) => {
    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }
    try {
      const res = await axios.post(api + "/login", { username, password });
      const userData = { username: res.data.username, token: res.data.token };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      setError("");
      setTab("dashboard");
      setShowLoginModal(false);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
      setUser(null);
      localStorage.removeItem("user");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setTab("dashboard");
  };

  const openLoginModal = () => {
    setError("");
    setShowLoginModal(true);
  };
  const closeLoginModal = () => setShowLoginModal(false);

  return (
    <div className="container">
      <Header
        tab={tab}
        setTab={setTab}
        user={user}
        login={login}
        logout={logout}
        error={error}
        openLoginModal={openLoginModal}
      />
      {tab === "dashboard" && <Dashboard />}
      {tab === "teams" && <TeamList />}
      {tab === "crud" && user ? (
        <LogicCrud token={user.token} />
      ) : tab === "crud" && !user ? (
        <div className="must-login-msg">
          Please log in as admin to access CRUD features.
        </div>
      ) : null}

      {showLoginModal && (
        <LoginModal onClose={closeLoginModal} login={login} error={error} />
      )}
    </div>
  );
}

// ---------- Header Component ----------
function Header({ tab, setTab, user, logout, openLoginModal }) {
  return (
    <nav className="navbar">
      <div className="header-logos-row">
        <div className="header-left">
          <img
            src={Swamiji}
            alt="Saral Mandal Logo"
            className="header-left-logo"
            title="Saral Mandal Logo"
          />
        </div>

        <div className="header-center">
          <img
            src={SaralMandal}
            alt="Main Logo"
            className="header-main-logo"
            title="Main Logo"
          />
          <div className="highlight-text">Saral Mandal</div>
          <div className="highlight-text">Akshar Sena</div>
          <h1 className="center-title">Level Up</h1>
          <p className="header-subtitle">Genius is Ever Genius</p>
        </div>

        <div className="header-right">
          <img
            src={GuruHari}
            alt="Genius Icon"
            className="header-right-image"
            title="Genius Icon"
          />
        </div>
      </div>

      <div className="nav-buttons">
        <button
          className={tab === "dashboard" ? "active" : ""}
          onClick={() => setTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={tab === "teams" ? "active" : ""}
          onClick={() => setTab("teams")}
        >
          Team Details
        </button>
        {user && (
          <button
            className={tab === "crud" ? "active" : ""}
            onClick={() => setTab("crud")}
          >
            CRUD (Point Logic)
          </button>
        )}
      </div>

      <div className="auth-section">
        {!user ? (
          <button onClick={openLoginModal} className="auth-button">
            Login
          </button>
        ) : (
          <button onClick={logout} className="logout-btn" aria-label="Logout">
            Logout ({user.username})
          </button>
        )}
      </div>
    </nav>
  );
}

// ---------- Login Modal ----------
function LoginModal({ onClose, login, error }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    login(username.trim(), password);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button type="submit">Login</button>
          {error && <div className="error">{error}</div>}
        </form>
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close Login Modal"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ---------- Dashboard ----------
function Dashboard() {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    axios.get(api + "/dashboard").then((res) => setTeams(res.data));
  }, []);

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="team-cards">
        {teams.map((team) => (
          <div className="team-card animated" key={team.id}>
            <img
              src={team.logo_url || "https://via.placeholder.com/60"}
              alt="logo"
            />
            <div className="team-name">{team.name}</div>
            <div
              className={`team-points ${
                team.total_points < 0 ? "negative-points" : ""
              }`}
            >
              Points: {team.total_points}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Team List ----------
function TeamList() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    axios.get(api + "/teams").then((res) => setTeams(res.data));
  }, []);

  if (!selectedTeam)
    return (
      <div>
        <h2>Teams</h2>
        <div className="team-cards">
          {teams.map((team) => (
            <div
              className="team-card pointer"
              key={team.id}
              onClick={() => setSelectedTeam(team.id)}
            >
              <img
                src={team.logo_url || "https://via.placeholder.com/60"}
                alt="logo"
              />
              <div className="team-name">{team.name}</div>
              <div
                className={`team-points ${
                  team.total_points < 0 ? "negative-points" : ""
                }`}
              >
                🏆 {team.total_points}
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <TeamDetail
      teamId={selectedTeam}
      onBack={() => setSelectedTeam(null)}
      setSelectedPlayer={setSelectedPlayer}
      selectedPlayer={selectedPlayer}
    />
  );
}

function TeamDetail({ teamId, onBack, setSelectedPlayer, selectedPlayer }) {
  const [team, setTeam] = React.useState(null);

  useEffect(() => {
    axios.get(api + `/team/${teamId}`).then((res) => setTeam(res.data));
  }, [teamId]);

  if (!team) return <div>Loading...</div>;
  if (selectedPlayer)
    return (
      <PlayerDetails
        playerId={selectedPlayer}
        onBack={() => setSelectedPlayer(null)}
      />
    );

  return (
    <div>
      <button onClick={onBack} className="back-btn">
        ← Back to Teams
      </button>
      <div className="team-card big">
        <img src={team.logo_url || "https://via.placeholder.com/60"} alt="logo" />
        <h3>{team.name}</h3>
        <div>Coach: {team.coach}</div>
        <div>Mentor: {team.mentor}</div>
        <h4>Players:</h4>
        <ul>
          {team.players.map((pl) => (
            <li
              key={pl.id}
              className="player-link"
              onClick={() => setSelectedPlayer(pl.id)}
            >
              {pl.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PlayerDetails({ playerId, onBack }) {
  const [breakdown, setBreakdown] = React.useState([]);
  const [totalPoints, setTotalPoints] = React.useState(0);

  useEffect(() => {
    axios.get(api + `/player/${playerId}`).then((res) => {
      setBreakdown(res.data || []);
      let total = 0;
      (res.data || []).forEach((item) => (total += item.points || 0));
      setTotalPoints(total);
    });
  }, [playerId]);

  return (
    <div>
      <button onClick={onBack} className="back-btn">
        ← Back to Team
      </button>
      <h4>Player activity breakdown</h4>
      <table>
        <thead>
          <tr>
            <th>Activity</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((row, i) => (
            <tr key={i}>
              <td>{row.activity}</td>
              <td>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={`total-points ${totalPoints < 0 ? "negative-points" : ""}`}>
        <strong>Total Points: {totalPoints}</strong>
      </div>
    </div>
  );
}

// ---------- LogicCrud ----------
function LogicCrud({ token }) {
  const [teams, setTeams] = React.useState([]);
  const [players, setPlayers] = React.useState([]);
  const [activities, setActivities] = React.useState([]);

  const [teamId, setTeamId] = React.useState("");
  const [playerId, setPlayerId] = React.useState("");
  const [activityId, setActivityId] = React.useState("");
  const [points, setPoints] = React.useState(0);
  const [msg, setMsg] = React.useState("");

  const axiosInstance = axios.create({
    headers: { Authorization: `Bearer ${token}` },
  });

  React.useEffect(() => {
    axios.get(api + "/teams").then((res) => setTeams(res.data));
    axios.get(api + "/activities").then((res) => setActivities(res.data));
  }, []);

  const onTeamChange = (e) => {
    const selectedTeamId = e.target.value;
    setTeamId(selectedTeamId);
    setPlayerId("");
    setPlayers([]);
    if (selectedTeamId) {
      axios
        .get(api + `/players/team/${selectedTeamId}`)
        .then((res) => setPlayers(res.data));
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!teamId || !playerId || !activityId) {
      setMsg("Complete all fields!");
      return;
    }

    if (points === 0) {
      setMsg("Points cannot be zero.");
      return;
    }

    setMsg("Saving...");
    axiosInstance
      .post(api + "/points", {
        player_id: playerId,
        activity_id: activityId,
        points: points,
      })
      .then(() => setMsg("Success! Reflected on dashboard!"))
      .catch(() => setMsg("Error saving data, try again."));
  };

  return (
    <div>
      <h2>Allocate Points (CRUD)</h2>
      <form className="logic-form" onSubmit={onSubmit}>
        <label>
          Select Team:
          <select value={teamId} onChange={onTeamChange} required>
            <option value="">Select</option>
            {teams.map((team) => (
              <option value={team.id} key={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Select Player:
          <select
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            disabled={!players.length}
            required
          >
            <option value="">Select</option>
            {players.map((player) => (
              <option value={player.id} key={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Select Activity:
          <select
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            required
          >
            <option value="">Select</option>
            {activities.map((act) => (
              <option value={act.id} key={act.id}>
                {act.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Points:
          <div className="point-inputs">
            <button type="button" onClick={() => setPoints((p) => p - 1)}>
              -
            </button>
            <input
              value={points}
              type="number"
              onChange={(e) => setPoints(Number(e.target.value))}
              // Removed min="0" to allow negative points
            />
            <button type="button" onClick={() => setPoints((p) => p + 1)}>
              +
            </button>
          </div>
        </label>
        <button type="submit">Allocate</button>
      </form>
      {msg && <div className="info-msg">{msg}</div>}
    </div>
  );
}
