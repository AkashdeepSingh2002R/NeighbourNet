const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");

dotenv.config();

const app = express();

app.use(express.json());

// CORS FIX: Allow frontend domain and credentials
app.use(
  cors({
    origin: "https://remarkable-pithivier-c497c5.netlify.app", // your Netlify frontend
    credentials: true,
  })
);
// SESSION FIX: Secure cookie for cross-origin
app.use(
  session({
    secret: "neighbournetsecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL,
    }),
    cookie: {
      secure: true,         // ⬅️ important for HTTPS
      sameSite: "None",     // ⬅️ required for cross-site cookies
    },
  })
);


// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api", authRoutes);
app.use("/api/users", userRoutes);

// Test Route
app.get("/test", (req, res) => {
  res.json({ msg: "Backend reachable" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
