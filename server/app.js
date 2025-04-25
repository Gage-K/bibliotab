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

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({ secret: "secret", resave: false, saveUninitialized: false }));

require("./config/passport")(passport); // lets app.js know about passport configuration
app.use(passport.initialize()); // everytime route reloads, it checks if user property is not null
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
    origin: "http://localhost:5173",
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
