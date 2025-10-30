<?php
// ===============================
// 🌱 CONFIGURACIÓN API
// ===============================
$apiBase = "https://independent-grace-production.up.railway.app/habits";
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Gestor de Hábitos</title>
  <style>
    :root {
      --primary: #3b82f6;
      --primary-dark: #1e40af;
      --success: #22c55e;
      --danger: #ef4444;
      --light: #f9fafb;
      --border: #e5e7eb;
      --text: #111827;
      --shadow: 0 6px 18px rgba(0,0,0,0.08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Poppins", sans-serif;
      background: var(--light);
      color: var(--text);
    }
    header {
      background: var(--primary);
      color: white;
      text-align: center;
      padding: 25px 10px;
      font-size: 1.7rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      box-shadow: var(--shadow);
    }
    main {
      max-width: 950px;
      margin: 40px auto;
      background: white;
      border-radius: 16px;
      box-shadow: var(--shadow);
      padding: 30px;
    }
    h2 { text-align: center; color: var(--primary-dark); margin-bottom: 20px; }
    form {
      display: flex; flex-wrap: wrap; gap: 10px;
      justify-content: center; margin-bottom: 35px;
    }
    input, select, button {
      padding: 10px 12px; border-radius: 8px;
      border: 1px solid var(--border); font-size: 1rem;
      transition: 0.2s;
    }
    input:focus, select:focus {
      border-color: var(--primary);
      outline: none;
      box-shadow: 0 0 0 2px rgba(37,99,235,0.2);
    }
    button {
      background: var(--primary);
      color: white;
      border: none;
      cursor: pointer;
      font-weight: 600;
    }
    button:hover { background: var(--primary-dark); }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 12px;
      border-bottom: 1px solid var(--border);
      text-align: left;
    }
    th {
      background: var(--primary);
      color: white;
      text-transform: uppercase;
      font-size: 0.9rem;
    }
    tr:nth-child(even) { background: #f3f4f6; }
    .actions { display: flex; gap: 5px; }
    .actions button {
      padding: 6px 10px;
      border-radius: 5px;
      font-size: 0.9rem;
    }
    .update-btn { background: var(--success); }
    .delete-btn { background: var(--danger); }
    .alert {
      position: fixed; top: 20px; right: 20px;
      padding: 14px 22px; border-radius: 8px;
      color: white; font-weight: 500;
      display: none; z-index: 100;
    }
    .alert.show { display: block; }
    .alert.success { background: var(--success); }
    .alert.error { background: var(--danger); }
    @media (max-width: 700px) {
      main { padding: 20px; }
      form { flex-direction: column; }
      table, thead, tbody, th, td, tr {
        display: block;
      }
      tr {
        margin-bottom: 15px;
        background: white;
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 12px;
        box-shadow: var(--shadow);
      }
      th { display: none; }
      td { border: none; padding: 8px 0; }
      td::before {
        content: attr(data-label);
        font-weight: bold;
        display: block;
        color: var(--primary);
        margin-bottom: 3px;
      }
    }
  </style>
</head>
<body>
  <header>📅 Gestor de Hábitos</header>

  <div class="alert" id="alertBox"></div>

  <main>
    <h2>Agregar nuevo hábito</h2>
    <form id="habitForm">
      <input type="text" id="title" placeholder="Título del hábito" required />
      <input type="text" id="description" placeholder="Descripción" />
      <select id="frequency">
        <option value="daily">Diario</option>
        <option value="weekly">Semanal</option>
      </select>
      <button type="submit">Agregar</button>
    </form>

    <h2>Lista de hábitos</h2>
    <table id="habitTable">
      <thead>
        <tr>
          <th>Título</th>
          <th>Descripción</th>
          <th>Frecuencia</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </main>

  <script>
    const API = "<?= $apiBase ?>";
    const alertBox = document.getElementById("alertBox");

    function showAlert(msg, type = "success") {
      alertBox.textContent = msg;
      alertBox.className = `alert show ${type}`;
      setTimeout(() => alertBox.classList.remove("show"), 2500);
    }

    async function loadHabits() {
      try {
        const res = await fetch(API);
        if (!res.ok) throw new Error("Error al cargar hábitos");
        const data = await res.json();

        const tbody = document.querySelector("#habitTable tbody");
        tbody.innerHTML = "";

        data.forEach(habit => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td data-label="Título">
              <input type="text" value="${habit.title}" class="edit-title" data-id="${habit.id}">
            </td>
            <td data-label="Descripción">
              <input type="text" value="${habit.description}" class="edit-desc" data-id="${habit.id}">
            </td>
            <td data-label="Frecuencia">
              <select class="edit-freq" data-id="${habit.id}">
                <option value="daily" ${habit.frequency === "daily" ? "selected" : ""}>Diario</option>
                <option value="weekly" ${habit.frequency === "weekly" ? "selected" : ""}>Semanal</option>
              </select>
            </td>
            <td data-label="Acciones" class="actions">
              <button class="update-btn" onclick="updateHabit('${habit.id}')">💾</button>
              <button class="delete-btn" onclick="deleteHabit('${habit.id}')">🗑</button>
            </td>`;
          tbody.appendChild(tr);
        });
      } catch (err) {
        showAlert("❌ No se pudo conectar con la API", "error");
      }
    }

    async function createHabit(e) {
      e.preventDefault();
      const title = document.getElementById("title").value.trim();
      const description = document.getElementById("description").value.trim();
      const frequency = document.getElementById("frequency").value;
      if (!title) return showAlert("⚠️ El título es obligatorio", "error");

      try {
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, frequency }),
        });
        if (!res.ok) throw new Error();
        showAlert("✅ Hábito agregado correctamente");
        document.getElementById("habitForm").reset();
        loadHabits();
      } catch {
        showAlert("❌ Error al agregar hábito", "error");
      }
    }

    async function updateHabit(id) {
      const title = document.querySelector(`.edit-title[data-id='${id}']`).value;
      const description = document.querySelector(`.edit-desc[data-id='${id}']`).value;
      const frequency = document.querySelector(`.edit-freq[data-id='${id}']`).value;

      try {
        const res = await fetch(`${API}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, frequency }),
        });
        if (!res.ok) throw new Error();
        showAlert("✅ Hábito actualizado");
      } catch {
        showAlert("❌ Error al actualizar", "error");
      }
    }

    async function deleteHabit(id) {
      if (!confirm("🗑 ¿Seguro que deseas eliminar este hábito?")) return;
      try {
        const res = await fetch(`${API}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        showAlert("✅ Hábito eliminado");
        loadHabits();
      } catch {
        showAlert("❌ Error al eliminar", "error");
      }
    }

    document.getElementById("habitForm").addEventListener("submit", createHabit);
    loadHabits();
  </script>
</body>
</html>
