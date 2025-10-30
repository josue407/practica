const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { parse } = require('csv-parse/sync');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// ===== CONFIGURACIÓN =====
const DATA_DIR = path.join(__dirname, 'data');
const CSV_PATH = path.join(DATA_DIR, 'habits.csv');

// ===== ASEGURAR ARCHIVO =====
async function ensureCsv() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(CSV_PATH);
  } catch {
    const writer = createCsvWriter({
      path: CSV_PATH,
      header: [
        { id: 'id', title: 'id' },
        { id: 'title', title: 'title' },
        { id: 'description', title: 'description' },
        { id: 'frequency', title: 'frequency' },
        { id: 'streak', title: 'streak' },
        { id: 'lastCompleted', title: 'lastCompleted' },
        { id: 'createdAt', title: 'createdAt' },
        { id: 'updatedAt', title: 'updatedAt' }
      ]
    });
    await writer.writeRecords([]); // crear CSV vacío
  }
}

// ===== LECTURA =====
async function readHabits() {
  await ensureCsv();
  const content = await fs.readFile(CSV_PATH, 'utf8');
  if (!content.trim()) return [];
  const records = parse(content, { columns: true, skip_empty_lines: true });
  return records.map(r => ({
    id: String(r.id),
    title: r.title,
    description: r.description,
    frequency: r.frequency,
    streak: Number(r.streak || 0),
    lastCompleted: r.lastCompleted || '',
    createdAt: r.createdAt || '',
    updatedAt: r.updatedAt || ''
  }));
}

// ===== ESCRITURA =====
async function writeHabits(arr) {
  const writer = createCsvWriter({
    path: CSV_PATH,
    header: [
      { id: 'id', title: 'id' },
      { id: 'title', title: 'title' },
      { id: 'description', title: 'description' },
      { id: 'frequency', title: 'frequency' },
      { id: 'streak', title: 'streak' },
      { id: 'lastCompleted', title: 'lastCompleted' },
      { id: 'createdAt', title: 'createdAt' },
      { id: 'updatedAt', title: 'updatedAt' }
    ]
  });
  await writer.writeRecords(arr);
}

// ===== RUTAS =====

// Página raíz
app.get('/', (req, res) => {
  res.send(`
    <h1 style="font-family:sans-serif; color:#2b6cb0;">
      ✅ API de Hábitos Diarios
    </h1>
    <p>Tu API está funcionando correctamente en Railway 🚀</p>
    <ul>
      <li><b>GET</b> /habits → lista todos los hábitos</li>
      <li><b>POST</b> /habits → crea un nuevo hábito</li>
      <li><b>PUT</b> /habits/:id → actualiza un hábito</li>
      <li><b>DELETE</b> /habits/:id → elimina un hábito</li>
    </ul>
  `);
});

// Listar hábitos
app.get('/habits', async (req, res) => {
  const habits = await readHabits();
  res.json(habits);
});

// Crear hábito
app.post('/habits', async (req, res) => {
  const { title, description = '', frequency = 'daily' } = req.body;
  if (!title) return res.status(400).json({ error: 'title es obligatorio' });

  const habits = await readHabits();
  const now = new Date().toISOString();

  const newHabit = {
    id: uuidv4(),
    title,
    description,
    frequency,
    streak: 0,
    lastCompleted: '',
    createdAt: now,
    updatedAt: now
  };

  habits.push(newHabit);
  await writeHabits(habits);
  res.status(201).json(newHabit);
});

// Actualizar hábito
app.put('/habits/:id', async (req, res) => {
  const habits = await readHabits();
  const idx = habits.findIndex(h => h.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'no encontrado' });

  const { title, description, frequency } = req.body;
  habits[idx] = {
    ...habits[idx],
    title: title ?? habits[idx].title,
    description: description ?? habits[idx].description,
    frequency: frequency ?? habits[idx].frequency,
    updatedAt: new Date().toISOString()
  };

  await writeHabits(habits);
  res.json(habits[idx]);
});

// Eliminar hábito
app.delete('/habits/:id', async (req, res) => {
  const habits = await readHabits();
  const idx = habits.findIndex(h => h.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'no encontrado' });

  const removed = habits.splice(idx, 1)[0];
  await writeHabits(habits);
  res.json({ success: true, removed });
});

// ===== SERVIDOR =====
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`)
);
