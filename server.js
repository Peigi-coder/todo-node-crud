const express = require("express");
const path = require("path");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 5000;
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
function validateTaskPayload(body, partial = false) {
  if (!partial) {
    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return "title is required and must be non-empty string";
    }
  }
  if ("priority" in body && body.priority != null) {
    const p = Number(body.priority);
    if (!Number.isInteger(p)) return "priority must be integer";
    if (p < 1 || p > 5) return "priority must be between 1 and 5";
  }
  if ("deadline" in body && body.deadline) {
    // prosty check formatu YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.deadline)) {
      return "deadline must be in format YYYY-MM-DD";
    }
  }
  return null;
}
app.get("/api/tasks", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM tasks ORDER BY datetime(created_at) DESC")
    .all();
  const tasks = rows.map(row => ({
    ...row,
    done: !!row.done
  }));
  res.status(200).json(tasks);
});


app.get("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ error: "Task not found" });
  row.done = !!row.done;
  res.status(200).json(row);
});


app.post("/api/tasks", (req, res) => {
  const payload = req.body || {};
  const err = validateTaskPayload(payload, false);
  if (err) return res.status(400).json({ error: err });

  const nowIso = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, priority, deadline, done, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    payload.title.trim(),
    payload.description || "",
    payload.priority != null ? Number(payload.priority) : 3,
    payload.deadline || null,
    payload.done ? 1 : 0,
    nowIso
  );
  const created = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);
  created.done = !!created.done;
  res.status(201).json(created);
});


app.put("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Task not found" });

  const payload = req.body || {};
  const err = validateTaskPayload(payload, true);
  if (err) return res.status(400).json({ error: err });

  const updated = {
    ...existing,
    title: payload.title != null ? String(payload.title) : existing.title,
    description:
      payload.description != null ? String(payload.description) : existing.description,
    priority:
      payload.priority != null ? Number(payload.priority) : existing.priority,
    deadline:
      payload.deadline !== undefined ? payload.deadline : existing.deadline,
    done:
      payload.done !== undefined ? (payload.done ? 1 : 0) : existing.done
  };

  db.prepare(
    `UPDATE tasks
     SET title = ?, description = ?, priority = ?, deadline = ?, done = ?
     WHERE id = ?`
  ).run(
    updated.title,
    updated.description,
    updated.priority,
    updated.deadline,
    updated.done,
    id
  );

  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  row.done = !!row.done;
  res.status(200).json(row);
});


app.delete("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Task not found" });

  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  res.status(204).send();
});


app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
