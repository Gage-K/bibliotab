const path = require("node:path");
const express = require("express");
const app = express();
const tests = require("./tests/queryTests");
require("dotenv").config();
const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth");
const session = require("express-session");
const passport = require("passport");

tests.runTests();

// this is for testing purposes
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.authenticate("session"));

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  console.log(res.locals.currentUser);
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use("/", indexRouter);
app.use("/", authRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log(`TabLab Express app running on port ${PORT}`)
);
