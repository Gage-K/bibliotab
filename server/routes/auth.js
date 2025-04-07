const express = require("express");
const { Router } = require("express");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcryptjs");
const db = require("../db/queries");
const router = Router();

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const rows = await db.getUserByUsername(username);
      const user = rows[0];
      const pwData = await db.getUserPassword(user.id);
      const currentPassword = pwData[0].password;

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      const match = await bcrypt.compare(password, currentPassword);
      if (!match) {
        // passwords do not match!
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const rows = await db.getUserById(id);
    const user = rows[0];

    done(null, user);
  } catch (err) {
    done(err);
  }
});

router.get("/login", (req, res, next) => res.render("login"));
router.post(
  "/login/password",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.get("/signup", (req, res, next) => {
  res.render("signup");
});

router.post("/signup", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await db.insertUser(username, email || null, hashedPassword);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
