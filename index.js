require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.by2cb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const userCollection = client.db("taskManager").collection("users");
    const taskCollection = client.db("taskManager").collection("tasks");

    app.post("/users", async (req, res) => {
      try {
        const { email, name } = req.body;
        if (!email || !name) return res.status(400).send({ error: "Missing required fields" });
    
        const existingUser = await userCollection.findOne({ email });
        if (existingUser) {
          return res.send({ message: "User Already Exists", insertedId: null });
        }
    
        const result = await userCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).send({ error: "Server Error" });
      }
    });
    
    app.post("/tasks", async (req, res) => {
      try {
        const { title, description, category, user } = req.body;
        if (!title || !user) return res.status(400).send({ error: "Title and User email are required" });
    
        const newTask = {
          title,
          description: description || "",
          category: category || "To-Do",
          user,
          createdAt: new Date(),
        };
    
        const result = await taskCollection.insertOne(newTask);
        res.send(result);
      } catch (error) {
        console.error("Error adding task:", error);
        res.status(500).send({ error: "Server Error" });
      }
    });


    app.get("/tasks", async (req, res) => {
      try {
        const { email } = req.query;
        if (!email) return res.status(400).send({ error: "Email is required" });
    
        const tasks = await taskCollection.find({ user: email }).toArray();
        res.send(tasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).send({ error: "Server Error" });
      }
    });
    
    app.put("/tasks/:id", async (req, res) => {
      try {
        const taskId = req.params.id;
        const { title, description, category } = req.body;
    
        const updatedTask = {
          ...(title && { title }),
          ...(description && { description }),
          ...(category && { category }),
        };
    
        const result = await taskCollection.updateOne({ _id: new ObjectId(taskId) }, { $set: updatedTask });
    
        res.send(result);
      } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).send({ error: "Server Error" });
      }
    });
    
   
    app.delete("/tasks/:id", async (req, res) => {
      try {
        const taskId = req.params.id;
    
        const result = await taskCollection.deleteOne({ _id: new ObjectId(taskId) });
    
        if (result.deletedCount === 0) {
          return res.status(404).send({ error: "Task not found" });
        }
    
        res.send({ message: "Task deleted successfully" });
      } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).send({ error: "Server Error" });
      }
    });



    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Task Manager server is Running");
});

app.listen(port, () => {
  console.log(`Task Manager server Running on port ${port}`);
});
