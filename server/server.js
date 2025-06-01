const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const dotenv = require("dotenv");

const userRoutes = require("./routes/userRoutes"); // ✅ match your folder exactly
const postRoutes = require("./routes/postRoutes");
const communityRoutes = require("./routes/communityRoutes");
const communityPostRoutes = require("./routes/communityPostRoutes");

dotenv.config();

const app = express();

app.use(express.json());

// ✅ Allow Netlify frontend + cookies
app.use(
  cors({
    origin: "https://remarkable-pithivier-c497c5.netlify.app",
    credentials: true,
  })
);

// ✅ Secure session for cookies to work on mobile
app.use(
  session({
    secret: "neighbournetsecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL,
    }),
    cookie: {
      secure: true,        // 🔒 Required for HTTPS (mobile devices)
      sameSite: "None",    // 🔄 Required for cross-origin cookies
    },
  })
);

// ✅ Connect MongoDB
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// ✅ All Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/community-posts", communityPostRoutes);

// ✅ Optional test route
app.get("/", (req, res) => {
  res.send("NeighbourNet backend is live 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
