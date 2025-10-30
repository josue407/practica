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

const csvWriter = createCsvWriter({
  path: CSV_PATH,
  header: [
    {id: 'id', title: 'id'},
    {id: 'title', title: 'title'},
    {id: 'description', title: 'description'},
    {id: 'frequency', title: 'frequency'},
    {id: 'streak', title: 'streak'},
    {id: 'lastCompleted', title: 'lastCompleted'},
    {id: 'createdAt', title: 'createdAt'},
    {id: 'updatedAt', title: 'updatedAt'}
  ],
  append: false
});

async function ensureCsv() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(CSV_PATH);
  } catch {
    await csvWriter.writeRecords([]); // crear el archivo vacío si no existe
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
  await csvWriter.writeRecords(arr);
}

// Rutas CRUD
app.get('/habits', async (req, res) => {
  const habits = await readHabits();
  res.json(habits);
});

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

app.put('/habits/:id', async (req, res) => {
  const habits = await readHabits();
  const idx = habits.findIndex(h => h.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'no encontrado' });
  const { title, description, frequency } = req.body;
  habits[idx] = { ...habits[idx], title, description, frequency, updatedAt: new Date().toISOString() };
  await writeHabits(habits);
  res.json(habits[idx]);
});

app.delete('/habits/:id', async (req, res) => {
  const habits = await readHabits();
  const idx = habits.findIndex(h => h.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'no encontrado' });
  const removed = habits.splice(idx, 1)[0];
  await writeHabits(habits);
  res.json({ success: true, removed });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));
