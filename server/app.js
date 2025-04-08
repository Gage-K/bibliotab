const path = require("node:path");
const express = require("express");
const app = express();
const tests = require("./tests/queryTests");
require("dotenv").config();
const indexRouter = require("./routes/index");
const authRouter = require("./routes/api/auth");
const usersRouter = require("./routes/api/users");
const tabsRouter = require("./routes/api/tabs");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const jwt = require("jsonwebtoken");

tests.runTests();

// this is for testing purposes
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));

require("./config/passport")(passport); // lets app.js know about passport configuration
app.use(passport.initialize()); // everytime route reloads, it checks if user property is not null
app.use(passport.session());
app.use(passport.authenticate("session"));

app.use((req, res, next) => {
  console.log(req.session);
  console.log(req.user);
  next();
});

app.use(express.json());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

/*
app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to the API",
  });
});

app.post("/api/posts", verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.ACCESS_TOKEN_SECRET, (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      res.json({
        message: "Post created...",
        authData,
      });
    }
  });
});

app.post("/api/login", (req, res) => {
  // Mock user
  const user = { id: 1, username: "brad", email: "brad@gmail.com" };
  jwt.sign(
    { user: user },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "10s" },
    (err, token) => {
      res.json({
        token: token,
      });
    }
  );
});

// FORMAT OF TOKEN

// Verify token
function verifyToken(req, res, next) {
  // Get auth header value
  const bearerHeader = req.headers["authorization"];
  // Check if bearer is undefined
  if (typeof bearerHeader !== "undefined") {
    // split at the space
    const bearer = bearerHeader.split(" ");
    // Get token from array
    const bearerToken = bearer[1];
    // set the token
    req.token = bearerToken;
    // Next middleware
    next();
  } else {
    // Forbidden
    res.sendStatus(403);
  }
}

/* app.use("/api/auth/", authRouter); */
app.use("/", indexRouter);

app.use("/api/", authRouter);
app.use("/api/user/", usersRouter);
app.use("/api/tabs/", tabsRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log(`TabLab Express app running on port ${PORT}`)
);
