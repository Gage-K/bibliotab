const db = require("../db/queries");
const bcrypt = require("bcryptjs");

async function getUser(req, res) {
  console.log("ran this");
  const { id } = req.params;
  console.log(res.locals.currentUser.id);
  const currentUser = res.locals.currentUser ? res.locals.currentUser.id : null;
  console.log(currentUser);

  if (currentUser !== id) {
    return res.status(403).json({ message: "You do not have access" });
  }

  const user = await db.getUserById(id);
  res.json(user[0]);
}

async function updateUserEmail(req, res) {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const currentUser = res.locals.currentUser
      ? res.locals.currentUser.id
      : null;

    if (currentUser !== id) {
      return res.status(403).json({ message: "You do not have access" });
    }

    const user = await db.getUserById(id);
    const listedEmails = await db.getUserByEmail(email);
    if (!user[0]) {
      res.json(`User does not exist`);
      return;
    }
    if (listedEmails[0]) {
      res.json({ message: `This email is already in use` });
      return;
    }

    await db.updateUserEmail(id, email);
    res.json(`Email updated.`);
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
    return Error(`User with email of ${email} already exists.`);
  }
  if (usernameData[0]) {
    return Error(`User with email of ${username} already exists.`);
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
