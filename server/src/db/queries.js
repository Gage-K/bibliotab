const pool = require("./pool");
require("dotenv").config();

// USER READ FUNCTIONS

// read function for all users
async function getAllUsers() {
  const { rows } = await pool.query("SELECT * FROM users");
  return rows;
}

// read function for user by username
async function getUserByUsername(username) {
  const values = [username];
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE username=$1",
    values
  );
  return rows;
}

async function getUserById(id) {
  const values = [id];
  const { rows } = await pool.query(`SELECT * FROM users WHERE id=$1`, values);
  return rows;
}

async function getUserByEmail(email) {
  const values = [email];
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    values
  );
  return rows;
}

// USER CREATE FUNCTIONS

// create function for a single user; returns new user's id
async function insertUser(username, email, password) {
  const values = [username, email, password, new Date()];

  // first grabs data for any users with identical credentials
  const emailData = await getUserByEmail(email);
  const usernameData = await getUserByUsername(username);

  // next returns errors and aborts IF email or username credentials exist in database
  if (emailData[0]) {
    console.error(
      `User with email of ${email} already exists. Create user aborted.`
    );
    return;
  }
  if (usernameData[0]) {
    console.error(
      `User with username of ${username} already exists. Create user aborted.`
    );
    return;
  }

  // then if no credentials already exist, create new user
  await pool.query(
    `INSERT INTO users (username, email, password, created_at)
                            VALUES ($1, $2, $3, $4)`,
    values
  );

  // return new user's id
  const userDetails = await getUserByUsername(username);
  return userDetails[0].id;
}

// USER UPDATE FUNCTIONS

async function updateUserPassword(id, newPassword) {
  const values = [id, newPassword];

  // check if user with id exists

  const userData = await getUserById(id);
  if (!userData[0]) {
    console.error(
      `User with id of ${id} does not exist. Update password aborted.`
    );
    return;
  }
  await pool.query(`UPDATE users SET password=$2 WHERE id=$1`, values);
  console.log(`Password for user with id of ${id} updated`);
}

async function updateUserEmail(id, newEmail) {
  const values = [id, newEmail];

  // check if user with id exists
  const userData = await getUserById(id);
  if (!userData[0]) {
    console.error(
      `User with id of ${id} does not exist. Update email aborted.`
    );
    return;
  }

  await pool.query(`UPDATE users SET email=$2 WHERE id=$1`, values);
  console.log(`Email for user with id of ${id} updated`);
}

// USER DELETE FUNCTIONS

async function deleteUser(id) {
  const values = [id];

  // check if user with id exists
  const userData = await getUserById(id);
  if (!userData[0]) {
    console.error(`User with id of ${id} does not exist. Delete aborted.`);
    return;
  }

  await pool.query(`DELETE FROM users WHERE id=$1`, values);
  console.log(`User with id of ${id} deleted`);
}

// TAB READ FUNCTIONS

async function getAllTabs() {
  const { rows } = await pool.query(`SELECT * FROM tabs`);
  return rows;
}

async function getTabsByUser(userId) {
  const values = [userId];
  const { rows } = await pool.query(
    `SELECT * FROM tabs WHERE user_id=$1`,
    values
  );
  return rows;
}

async function getTabById(id) {
  const values = [id];
  const { rows } = await pool.query(`SELECT * FROM tabs WHERE id=$1`, values);
  return rows;
}

async function getTabsByName(tabName) {
  const values = [tabName];
  const { rows } = await pool.query(
    `SELECT * FROM tabs WHERE tab_name=$1`,
    values
  );
  return rows;
}

async function getTabsByArtist(artist) {
  const values = [artist];
  const { rows } = await pool.query(
    `SELECT * FROM tabs WHERE tab_artist=$1`,
    values
  );
  return rows;
}

// TAB CREATE FUNCTIONS

async function insertTab(userId, name, artist, tuning, tab) {
  // inserts new tab (duplicate details ok)
  // returns id of inserted row for tab
  const createdAt = new Date();
  const modifiedAt = new Date();
  const values = [userId, name, artist, tuning, createdAt, modifiedAt, tab];

  const insertedRow = await pool.query(
    `INSERT INTO tabs (user_id, tab_name, tab_artist, tuning, created_at, modified_at, tab)
                        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    values
  );
  return insertedRow.rows[0].id;
}

// TAB UPDATE FUNCTIONS

async function updateTabName(id, name) {
  const values = [id, name];
  const tabData = await getTabById(id);
  if (!tabData[0]) {
    console.error(`Tab with id of ${id} does not exist. Update aborted.`);
    return;
  }
  await pool.query(`UPDATE tabs SET name=$2 WHERE id=$1`, values);
  console.log(`Name of tab with id of ${id} updated`);
}

async function updateTabArtist(id, artist) {
  const values = [id, artist];
  const tabData = await getTabById(id);
  if (!tabData[0]) {
    console.error(`Tab with id of ${id} does not exist. Update aborted.`);
    return;
  }
  await pool.query(`UPDATE tabs SET artist=$2 WHERE id=$1`, values);
  console.log(`Artist of tab with id of ${id} updated`);
}

async function updateTuning(id, tuning) {
  const values = [id, tab];
  const tabData = await getTabById(id);
  if (!tabData[0]) {
    console.error(`Tab with id of ${id} does not exist. Update aborted.`);
    return;
  }
  await pool.query(`UPDATE tabs SET tuning=$2 WHERE id=$1`, values);
  console.log(`Tuning of tab with id of ${id} updated`);
}

async function updateTab(id, tab) {
  const values = [id, tab];
  const tabData = await getTabById(id);
  if (!tabData[0]) {
    console.error(`Tab with id of ${id} does not exist. Update aborted.`);
    return;
  }
  await pool.query(`UPDATE tabs SET tab=$2 WHERE id=$1`, values);
  console.log(`Tablature with id of ${id} updated`);
}

// TAB DELETE FUNCTIONS

async function deleteTab(id) {
  const values = [id];
  const tabData = await getTabById(id);
  if (!tabData[0]) {
    console.error(`Tab with id of ${id} does not exist. Delete aborted.`);
    return;
  }
  await pool.query(`DELETE FROM tabs WHERE id=$1`, values);
  console.log(`Tab with id of ${id} deleted`);
}

module.exports = {
  getAllUsers,
  getUserByUsername,
  getUserById,
  getUserByEmail,
  insertUser,
  updateUserPassword,
  updateUserEmail,
  deleteUser,
  getAllTabs,
  getTabById,
  getTabsByArtist,
  getTabsByUser,
  getTabsByName,
  insertTab,
  updateTabName,
  updateTabArtist,
  updateTuning,
  updateTab,
  deleteTab,
};
