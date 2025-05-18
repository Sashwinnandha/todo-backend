const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
//const http = require('http');
const cors = require('cors');
require('dotenv').config();
//const socketIo = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

//--------------------------------------Web socket -------------------------------------------------

// const server = http.createServer(app);

// const io = socketIo(server, {
//   cors: {
//     origin:  process.env.CLIENT_ORIGIN ||  'http://localhost:3000',
//     methods: ['GET', 'POST'],
//   },
// });

// MongoDB connection here...

// // WebSocket setup
// io.on('connection', (socket) => {
//   console.log('New client connected:', socket.id);

//   // socket.on('send_message', (data) => {
//   //   console.log('Message received:', data.text);
//   //   // Optionally store in MongoDB
//   //   io.emit('receive_message', data.text); // broadcast to all clients
//   // });

//     socket.on('alltasks', async ({date}) => {
//     try {
//       const tasks = await tasksCollection.find().toArray();
//       const newTasks=tasks.filter((e)=>e.date===date)
//       io.emit("tasks",newTasks)
//     } catch (err) {
//       console.error('Error retrieving tasks:', err);
//       io.emit("messages","Couldn't find all the tasks")
//     }

//   });

//         socket.on('newtask', async (body) => {
//       try {
//         const {text,completed,date} = body;
//         console.log(text)
//         const newData={text,completed,date}
//         await tasksCollection.insertOne(newData);
//         const tasks = await tasksCollection.find().toArray();
//         const newTasks=tasks.filter((e)=>e.date===date)
//         io.emit("tasksAdded",{data:newTasks,severity: 'success', summary: 'Success', detail:`${text} Added Successfully`})
//         // io.emit("messages",{ severity: 'success', summary: 'Success', detail:`${text} Added Successfully`})
//       } catch (err) {
//         console.error('Error inserting task:', err);
//         io.emit("messages","Couldn't add the task")
//       }
//     });

//       socket.on('update', async (body) => {
//       try {
//         const { _id, status,date } = body;

//         await tasksCollection.updateOne(
//           { _id: new ObjectId(_id)},
//           { $set: { completed: status } }
//         );
//         const tasks = await tasksCollection.find().toArray();
//         const newTasks=tasks.filter((e)=>e.date===date)
//         io.emit("tasks",newTasks)
//       } catch (err) {
//         console.error("messages",'Error updating task status:', err);
//         io.emit("messages","Couldn't update the selected task")
//       }
//     });

//     socket.on('delete', async (body) => {
//       try {
//         const { _id,date } = body;

//         await tasksCollection.deleteOne({ _id: new ObjectId(_id) });

//         const tasks = await tasksCollection.find().toArray();

//         const newTasks=tasks.filter((e)=>e.date===date)

//         io.emit("tasks",newTasks)
//       } catch (err) {
//         console.error('Error deleting task:', err);
//         io.emit("messages","Couldn't delete the selected task")
//       }
//     });
  

//   socket.on('disconnect', () => {
//     console.log('Client disconnected:', socket.id);
//   });
// });

// // // const PORT = 5000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//--------------------------------------Web socket -------------------------------------------------

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
        await tasksCollection.insertOne(newTask);
        const tasks = await tasksCollection.find().toArray();
        const newTasks=tasks.filter((e)=>e.date===newTask.date)
        res.status(201).json(newTasks);
      } catch (err) {
        console.error('Error inserting task:', err);
        res.status(500).json({ error: 'Failed to insert task' });
      }
    });

    //POST update task status
    app.post('/task', async (req, res) => {
      try {
        const { _id, status ,date} = req.body;
        const tasks = await tasksCollection.find().toArray();

        await tasksCollection.updateOne(
          { _id: new ObjectId(_id)},
          { $set: { completed: status } }
        );

        const updated = await tasksCollection.find().toArray();
        const newTasks=updated.filter((e)=>e.date===date)

        res.status(201).json(newTasks);
      } catch (err) {
        console.error('Error updating task status:', err);
        res.status(500).json({ error: 'Failed to update task status' });
      }
    });

   // POST delete task by index
    app.post('/taskid', async (req, res) => {
      try {
        const { _id ,date} = req.body;

        await tasksCollection.deleteOne({ _id: new ObjectId(_id) });

        const tasks = await tasksCollection.find().toArray();
        const newTasks=tasks.filter((e)=>e.date===date)

        res.status(201).json(newTasks);
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
