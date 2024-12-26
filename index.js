const express = require("express");
const nodemailer = require("nodemailer");
const port = process.env.port || 9090;
const { MongoClient, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "hritikgangadhar90@gmail.com",
    pass: "tvzd ovpm zuag bmrv",
  },
});

let connectDB; // Reusable database connection object
let client; // MongoClient instance

const dbCon = async () => {
  try {
    // Create a reusable connection only if it doesn't exist
    if (!client) {
      client = new MongoClient("mongodb://localhost:27017/");
      await client.connect();
      console.log("connected");
      const database = client.db("portfolio");
      connectDB = database.collection("personal");
    }
    return connectDB;
  } catch (err) {
    console.error("Error connecting to database:", err);
    throw new Error("Database connection failed");
  }
};

// POST route to send message and save it to the database
app.post("/message", async (req, res) => {
  const dbConnect = await dbCon();
  const { userName, email, message } = req.body;

  if (!userName || !email || !message) {
    return res.status(400).json({ msg: "All fields are compulsory" });
  }

  try {
    const time = new Date();
    let mailOptions = {
      from: "hritikgangadhar90@gmail.com",
      to: email,
      subject: "Acknowledgment of Your Message",
      text: `Thank you for reaching out to me. I have received your message on ${time.toLocaleDateString()} and will review it as soon as possible. I will get back to you promptly.`,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ msg: "Failed to send email" });
      } else {
        await dbConnect.insertOne(req.body); // Save message in database
        res
          .status(200)
          .cookie("name", "HritikGangadhar")
          .json({ msg: "Email sent and message saved successfully" });
      }
    });
  } catch (err) {
    console.error("Error in /message:", err);
    res.status(500).json({ msg: "Something went wrong" });
  }
});

// GET route to fetch all messages
app.get("/", async (req, res) => {
  const dbConnect = await dbCon();
  try {
    const users = await dbConnect.find().toArray();
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ msg: "Failed to fetch messages" });
  }
});

// DELETE route to remove a message by ID
app.delete("/delete/:id", async (req, res) => {
  const id = req.params.id;
  const dbConnect = await dbCon();

  if (!id) {
    return res.status(400).json({ msg: "ID is compulsory" });
  }

  try {
    const result = await dbConnect.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount > 0) {
      res.status(200).json({ msg: "Message deleted successfully" });
    } else {
      res.status(404).json({ msg: "Message not found" });
    }
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).json({ msg: "Something went wrong" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server has been started at port:${port}`);
});
