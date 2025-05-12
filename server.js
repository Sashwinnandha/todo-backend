const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

let tasksCollection;

// Retry logic for MongoDB connection
async function connectToMongoDB() {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const client = new MongoClient(MONGO_URI);
      await client.connect();
      console.log('✅ MongoDB connected!');
      tasksCollection = client.db('todoApp').collection('tasks');
      break;  // Exit loop once connected
    } catch (err) {
      attempt++;
      console.warn(`⚠️ MongoDB connect attempt ${attempt} failed: ${err.message}`);
      if (attempt >= maxRetries) {
        throw new Error('❌ Failed to connect to MongoDB after retries');
      }
      // Wait for a short period before retrying (e.g. 2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

// Connect to MongoDB and then start the server
connectToMongoDB()
  .then(() => {
    // Routes should be defined after MongoDB connection is established
    // GET all tasks
    app.post('/tasks', async (req, res) => {
      try {
        const {date}=req.body
        const tasks = await tasksCollection.find().toArray();
        const newTasks=tasks.filter((e)=>e.date===date)
        res.json(newTasks);
      } catch (err) {
        console.error('Error retrieving tasks:', err);
        res.status(500).json({ error: 'Failed to retrieve tasks' });
      }
    });

    // POST new task
    app.post('/newtask', async (req, res) => {
      try {
        const newTask = req.body;
        const result = await tasksCollection.insertOne(newTask);
        res.status(201).json({ ...newTask, _id: result.insertedId });
      } catch (err) {
        console.error('Error inserting task:', err);
        res.status(500).json({ error: 'Failed to insert task' });
      }
    });

    // POST update task status
    app.post('/task', async (req, res) => {
      try {
        const { _id, status } = req.body;
        const tasks = await tasksCollection.find().toArray();

        await tasksCollection.updateOne(
          { _id: new ObjectId(_id)},
          { $set: { completed: status } }
        );

        res.status(201).json({_id, completed: status });
      } catch (err) {
        console.error('Error updating task status:', err);
        res.status(500).json({ error: 'Failed to update task status' });
      }
    });

    // POST delete task by index
    app.post('/taskid', async (req, res) => {
      try {
        const { _id } = req.body;

        await tasksCollection.deleteOne({ _id: new ObjectId(_id) });

        res.status(201).json('Deleted Successfully');
      } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ error: 'Failed to delete task' });
      }
    });

    // Start the server only after MongoDB is connected
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

  })
  .catch((err) => {
    console.error('🛑 Could not start server:', err.message);
  });
