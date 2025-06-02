const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const communityRoutes = require("./routes/communityRoutes");
const communityPostRoutes = require("./routes/communityPostRoutes");

dotenv.config(); // Load .env variables

const app = express(); // ✅ Define app here FIRST

// Check if MONGO_URL is set
if (!process.env.MONGO_URL) {
  throw new Error("❌ MONGO_URL is not defined. Check your .env file.");
}

app.use(express.json());

// CORS setup
app.use(
  cors({
    origin: "https://remarkable-pithivier-c497c5.netlify.app", // your frontend
    credentials: true,
  })
);

// Session setup
app.use(
  session({
    secret: "neighbournetsecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL,
    }),
    cookie: {
      secure: true,
      sameSite: "None",
    },
  })
);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/community-posts", communityPostRoutes);

app.get("/", (req, res) => {
  res.send("NeighbourNet backend running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
