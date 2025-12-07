const API_URL = "http://127.0.0.1:5000/api";

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function loadTasks() {
  const res = await fetch(`${API_URL}/tasks`);
  const tasks = await res.json();

  const list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach(t => {
    const li = document.createElement("li");
    li.className = t.done ? "done" : "";
    li.innerHTML = `
      <b>${escapeHtml(t.title)}</b> — ${escapeHtml(t.description || "")}
      [priority: ${t.priority}] 
      [deadline: ${t.deadline || "-"}]
      [${t.done ? "done ✅" : "pending ⏳"}]
      <button onclick="editTask(${t.id})">Edit</button>
      <button onclick="deleteTask(${t.id})">Delete</button>
    `;
    list.appendChild(li);
  });
}

async function saveTask() {
  const id = document.getElementById("taskId").value;
  const payload = {
    title: document.getElementById("taskTitle").value,
    description: document.getElementById("taskDesc").value,
    priority: parseInt(document.getElementById("taskPriority").value || 3),
    deadline: document.getElementById("taskDeadline").value || null,
    done: document.getElementById("taskDone").checked
  };

  if (!payload.title) {
    alert("Title is required");
    return;
  }
  if (payload.priority < 1 || payload.priority > 5) {
    alert("Priority must be between 1 and 5");
    return;
  }

  const url = id ? `${API_URL}/tasks/${id}` : `${API_URL}/tasks`;
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert("Error: " + (err.error || res.status));
    return;
  }

  clearForm();
  loadTasks();
}

async function editTask(id) {
  const res = await fetch(`${API_URL}/tasks/${id}`);
  if (!res.ok) {
    alert("Task not found");
    return;
  }
  const t = await res.json();
  document.getElementById("taskId").value = t.id;
  document.getElementById("taskTitle").value = t.title;
  document.getElementById("taskDesc").value = t.description || "";
  document.getElementById("taskPriority").value = t.priority || 3;
  document.getElementById("taskDeadline").value = t.deadline || "";
  document.getElementById("taskDone").checked = !!t.done;
}

async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  await fetch(`${API_URL}/tasks/${id}`, { method: "DELETE" });
  loadTasks();
}

function clearForm() {
  document.getElementById("taskId").value = "";
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDesc").value = "";
  document.getElementById("taskPriority").value = 3;
  document.getElementById("taskDeadline").value = "";
  document.getElementById("taskDone").checked = false;
}

window.addEventListener("load", loadTasks);
