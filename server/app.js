const path = require("node:path");
const express = require("express");
const app = express();
require("dotenv").config();
const indexRouter = require("./routes/index");
const authRouter = require("./routes/api/auth");
const usersRouter = require("./routes/api/users");
const tabsRouter = require("./routes/api/tabs");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Makes app.js aware of passport configuration
require("./config/passport")(passport);

// Checks if `user` property is null on every route
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate("session"));

app.use(express.json());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FE_API,
    credentials: true,
  })
);

app.use("/", indexRouter);
app.use("/api/", authRouter);
app.use("/api/user/", usersRouter);
app.use("/api/tabs/", tabsRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log(`TabLab Express app running on port ${PORT}`)
);
