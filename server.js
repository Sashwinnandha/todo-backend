const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

let tasksCollection;

// Connect to MongoDB
MongoClient.connect(MONGO_URI, { useUnifiedTopology: true })
  .then(client => {
    const db = client.db('todoApp');
    tasksCollection = db.collection('tasks');
    console.log('Connected to MongoDB');
  })
  .catch(err => console.error('MongoDB connection error:', err));

// GET all tasks
app.get('/tasks', async (req, res) => {
  const tasks = await tasksCollection.find().toArray();
  res.json(tasks);
});

// POST new task
app.post('/tasks', async (req, res) => {
  const newTask = req.body;
  const result = await tasksCollection.insertOne(newTask);
  res.status(201).json({ ...newTask, _id: result.insertedId });
});

// POST update task status
app.post('/task', async (req, res) => {
  const { index, status } = req.body;
  const tasks = await tasksCollection.find().toArray();

  if (index < 0 || index >= tasks.length) {
    return res.status(400).json({ error: 'Invalid index' });
  }

  const task = tasks[index];
  await tasksCollection.updateOne(
    { _id: task._id },
    { $set: { completed: status } }
  );

  res.status(201).json({ ...task, completed: status });
});

// POST delete task by index
app.post('/taskid', async (req, res) => {
  const { index } = req.body;
  const tasks = await tasksCollection.find().toArray();

  if (index < 0 || index >= tasks.length) {
    return res.status(400).json('Invalid task index');
  }

  const taskToDelete = tasks[index];
  await tasksCollection.deleteOne({ _id: taskToDelete._id });

  res.status(201).json('Deleted Successfully');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
