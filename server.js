const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 5000;

const DATA_FILE = './tasks.json';

app.use(cors());
app.use(express.json());

// Read tasks from JSON file
function readTasks() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data || '[]');
}

function updateTasks(index,status) {
  if (!fs.existsSync(DATA_FILE)) return [];

  const rawData = fs.readFileSync(DATA_FILE, 'utf8');
  const tasks = JSON.parse(rawData);

   if (index < 0 || index >= tasks.length) {
    console.error('Invalid task index');
    return;
  }

  // Toggle the completed flag
  tasks[index].completed = status;

  // Save updated tasks
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
  return tasks[index]; // or return as needed
}

function deleteTasks(index,status) {
  if (!fs.existsSync(DATA_FILE)) return [];

  const rawData = fs.readFileSync(DATA_FILE, 'utf8');
  const tasks = JSON.parse(rawData);

   if (index < 0 || index >= tasks.length) {
    console.error('Invalid task index');
    return "Invalid task index";
  }

  // Toggle the completed flag
  const newTasks=Object.values(tasks).filter((each,eachIndex)=>eachIndex!==index)

  // Save updated tasks
  fs.writeFileSync(DATA_FILE, JSON.stringify(newTasks, null, 2));
  return "Deleted Successfully"; // or return as needed
}
// Write tasks to JSON file
function writeTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

// GET all tasks
app.get('/tasks', (req, res) => {
  const tasks = readTasks();
  res.json(tasks);
});

// POST new task
app.post('/tasks', (req, res) => {
  const tasks = readTasks();
  const newTask = req.body;
  tasks.push(newTask);
  writeTasks(tasks);
  res.status(201).json(newTask);
});

app.post('/task', (req, res) => {
  const tasks = readTasks();
  const {index,status} = req.body;
  updateTasks(index,status)
  res.status(201).json(tasks[index]);
})

app.post('/taskid',(req,res)=>{
  const {index} = req.body;
  const msg=deleteTasks(index)
  res.status(201).json(msg);
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
