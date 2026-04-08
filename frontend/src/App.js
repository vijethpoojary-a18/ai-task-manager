import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Click the mic to speak your task");
  const [voiceStep, setVoiceStep] = useState("idle");
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    fetch("http://localhost:5000/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTitle) return;
    const res = await fetch("http://localhost:5000/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, description: newDescription }),
    });
    const data = await res.json();
    setTasks([...tasks, data]);
    setNewTitle("");
    setNewDescription("");
  };

  const deleteTask = async (id) => {
    await fetch(`http://localhost:5000/tasks/${id}`, { method: "DELETE" });
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const toggleCompleted = async (task) => {
    await fetch(`http://localhost:5000/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...task, completed: !task.completed }),
    });
    setTasks(tasks.map((t) =>
      t.id === task.id ? { ...t, completed: !t.completed } : t
    ));
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const listenOnce = (onResult) => {
    if (!SpeechRecognition) {
      alert("Please use Chrome for voice recognition.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      onResult(transcript);
    };
    recognition.onerror = () => {
      setListening(false);
      setVoiceStatus("Error. Try again.");
      setVoiceStep("idle");
    };
  };

  const startVoiceAssistant = () => {
    if (!SpeechRecognition) {
      alert("Please use Chrome for voice recognition.");
      return;
    }
    setVoiceStep("title");
    setVoiceStatus("🎙️ Listening for task title...");
    speak("What is the task title?");

    setTimeout(() => {
      listenOnce((title) => {
        setNewTitle(title);
        setVoiceStatus(`✅ Title: "${title}" — Now listening for description...`);
        speak("Got it. Now tell me the description.");

        setTimeout(() => {
          setVoiceStep("description");
          listenOnce(async (description) => {
            setNewDescription(description);
            setVoiceStatus(`✅ Saving task: "${title}"`);
            setVoiceStep("saving");
            speak(`Saving your task: ${title}`);

            const res = await fetch("http://localhost:5000/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title, description }),
            });
            const data = await res.json();
            setTasks((prev) => [...prev, data]);
            setNewTitle("");
            setNewDescription("");
            setVoiceStatus("✅ Task saved! Click mic to add another.");
            setVoiceStep("idle");
          });
        }, 1500);
      });
    }, 1500);
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const activeTasks = totalTasks - completedTasks;

  return (
    <>
      <div className="blob-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
        <div className="blob blob-5"></div>
      </div>

      <div className="app-wrapper">

        {/* Header */}
        <div className="app-header">
          <div className="header-top">
            <div></div>
            <div className="header-center">
              <span className="header-icon">🧠</span>
              <h1>AI Task Manager</h1>
              <p>Stay focused. Get things done.</p>
              <div className="header-line"></div>
            </div>
            <button
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle theme"
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-number">{totalTasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-number green">{completedTasks}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number blue">{activeTasks}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>

        {/* Two Column */}
        <div className="two-col">

          {/* LEFT */}
          <div className="left-col">

            {/* Voice Box */}
            <div className="voice-box">
              <div className="voice-box::before"></div>
              <div className="voice-box-header">
                <span className="voice-icon">🤖</span>
                <div>
                  <div className="voice-title">Voice Assistant</div>
                  <div className="voice-subtitle">Speak to add tasks hands-free</div>
                </div>
              </div>

              <div className={`voice-status ${listening ? "listening-pulse" : ""}`}>
                {voiceStatus}
              </div>

              <div className="voice-steps">
                <div className={`step ${voiceStep === "title" ? "active" : ""}`}>
                  <span>1</span> Title
                </div>
                <div className="step-line"></div>
                <div className={`step ${voiceStep === "description" ? "active" : ""}`}>
                  <span>2</span> Description
                </div>
                <div className="step-line"></div>
                <div className={`step ${voiceStep === "saving" ? "active" : ""}`}>
                  <span>3</span> Save
                </div>
              </div>

              <button
                className={`mic-big-btn ${listening ? "mic-active" : ""}`}
                onClick={startVoiceAssistant}
                disabled={listening || voiceStep !== "idle"}
              >
                <span className="mic-icon-big">🎙️</span>
                <span>{listening ? "Listening..." : voiceStep !== "idle" ? "Processing..." : "Start Voice"}</span>
              </button>
            </div>

            {/* Manual Form */}
            <div className="form-card">
              <div className="form-card-header">✍️ Add Manually</div>
              <form onSubmit={addTask}>
                <div className="field-label">📝 Task Title</div>
                <div className="input-row">
                  <input
                    className="styled-input"
                    type="text"
                    placeholder="e.g. Complete project report..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="field-label">💬 Description</div>
                <div className="input-row">
                  <textarea
                    className="styled-textarea"
                    placeholder="Add more details..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
                <button type="submit" className="add-btn">✦ Add Task</button>
              </form>
            </div>
          </div>

          {/* RIGHT — Saved Tasks */}
          <div className="right-col">
            <div className="tasks-box">
              <div className="tasks-box-header">
                <span>📋 Saved Tasks</span>
                <span className="tasks-count">{totalTasks}</span>
              </div>

              {tasks.length === 0 ? (
                <div className="empty-state">
                  <span className="icon">✨</span>
                  <h3>No tasks yet!</h3>
                  <p>Use voice or manual form to add tasks.</p>
                </div>
              ) : (
                <div className="tasks-list">
                  {tasks.map((task) => (
                    <div
                      className={`task-card ${task.completed ? "completed" : ""}`}
                      key={task.id}
                    >
                      <div className="task-card-top">
                        <span className={`task-badge ${task.completed ? "done" : ""}`}>
                          {task.completed ? "✓ Done" : "● Active"}
                        </span>
                        <button className="del-btn" onClick={() => deleteTask(task.id)}>
                          🗑
                        </button>
                      </div>
                      <div className={`task-title ${task.completed ? "completed" : ""}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="task-desc">{task.description}</div>
                      )}
                      <div className="task-footer">
                        <label className="check-wrap">
                          <input
                            type="checkbox"
                            className="custom-check"
                            checked={task.completed}
                            onChange={() => toggleCompleted(task)}
                          />
                          <span className={`check-label ${task.completed ? "done" : ""}`}>
                            {task.completed ? "Completed" : "Mark done"}
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default App;