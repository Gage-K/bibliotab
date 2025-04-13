const { Router } = require("express");
const router = Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const db = require("../../db/queries");
const utils = require("../../lib/utils");

router.post("/login", async (req, res, next) => {
  const { username, password } = req.body;
  console.log(req.body);
  try {
    console.log("login route");
    const rows = await db.getUserByUsername(username);
    const user = rows[0];

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Username not found" });
    }
    const pwData = await db.getUserPassword(user.id);
    const currentPassword = pwData[0].password;
    const isValid = await bcrypt.compare(password, currentPassword);

    if (isValid) {
      const tokenObject = utils.issueJWT(user);

      res.status(200).json({
        success: true,
        user: user,
        token: tokenObject.token,
        expiresIn: tokenObject.expires,
      });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "incorrect password" });
    }
  } catch (err) {
    done(err);
  }
});

router.post("/register", async (req, res, next) => {
  // insert user info into dbs and then issue JWT
  try {
    const { username, email, password } = req.body;
    const userData = await db.getUserByUsername(username);

    if (userData[0]) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db
      .insertUser(username, email || null, hashedPassword)
      .then((user) => {
        const jwt = utils.issueJWT(user);

        res.json({
          success: true,
          user: user,
          token: jwt.token,
          expiresIn: jwt.expires,
        });
      });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.get(
  "/protected",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    res.status(200).json({
      success: true,
      msg: "You are successfully authenticated to this route!",
    });
  }
);

router.post("/test", (req, res) => {
  const { username, password } = req.body;
  console.log(req.body);
  res.status(200).json({
    message: "Successfully pinged",
    username: username,
    password: password,
  });
});

router.get(
  "/test",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    console.log(req.user);
    res.status(200).json({
      success: true,
      msg: "You are successfully authenticated to this route!",
    });
  }
);

module.exports = router;
