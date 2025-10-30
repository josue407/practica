const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { parse } = require('csv-parse/sync');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const CSV_PATH = path.join(DATA_DIR, 'habits.csv');

// ✅ Crear CSV vacío si no existe
async function ensureCsv() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(CSV_PATH);
  } catch {
    const csvWriter = createCsvWriter({
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
      ],
      append: false
    });
    await csvWriter.writeRecords([]); // Crea archivo vacío
  }
}

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

async function writeHabits(arr) {
  await ensureCsv();
  const csvWriter = createCsvWriter({
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
    ],
    append: false
  });
  await csvWriter.writeRecords(arr);
}

// 🔹 GET todos los hábitos
app.get('/habits', async (req, res) => {
  try {
    const habits = await readHabits();
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 POST crear hábito
app.post('/habits', async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 PUT actualizar hábito
app.put('/habits/:id', async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 DELETE eliminar hábito
app.delete('/habits/:id', async (req, res) => {
  try {
    const habits = await readHabits();
    const idx = habits.findIndex(h => h.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'no encontrado' });
    const removed = habits.splice(idx, 1)[0];
    await writeHabits(habits);
    res.json({ success: true, removed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Escuchar puerto correcto (Railway)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});