const db = require("../db/queries");
const bcrypt = require("bcryptjs");

async function getUser(req, res) {
  const userId = req.user.id;

  if (userId) {
    const user = await db.getUserById(userId);
    res.json(user[0]);
  } else {
    return res.status(403).json({ message: "You do not have access" });
  }
}

async function updateUserEmail(req, res) {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    // check if email is in use
    const listedEmails = await db.getUserByEmail(email);
    if (listedEmails[0]) {
      res.status(409).json({ message: `This email is already in use` });
      return;
    }

    await db.updateUserEmail(userId, email);
    res.status(201).json({ message: `Email updated` });
  } catch (err) {
    console.error(err);
  }
}

async function insertUser(req, res) {
  const { username, email, passsword } = req.body;
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  // grabs data to check if email / username is in use; if yes, return errors
  const emailData = await db.getUserByEmail(email);
  const usernameData = await db.getUserByUsername(username);

  if (emailData[0]) {
    return Error(`Email is already in use.`);
  }
  if (usernameData[0]) {
    return Error(`Username is taken.`);
  }

  // then if no credentials already exist, create new user
  const id = await db.insertUser(username, email, hashedPassword);
  res.json(id);
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const currentUser = res.locals.currentUser
      ? res.locals.currentUser.id
      : null;
    if (currentUser !== id) {
      return res.status(403).json({ message: "You do not have access" });
    }
    const user = await db.getUserById(id);
    if (!user[0]) {
      res.json(`User does not exist`);
    }
    await db.deleteUser(id);
    res.json(`User deleted.`);
  } catch (err) {
    console.error(err);
    next(err);
  }
}

module.exports = {
  getUser,
  updateUserEmail,
  insertUser,
  deleteUser,
};
