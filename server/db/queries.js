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
  const userValues = [username, email, new Date()];

  try {
    await pool.query(
      `INSERT INTO users (username, email, created_at)
                            VALUES ($1, $2, $3)`,
      userValues
    );
  } catch (err) {
    return err;
  }
  const userDetails = await getUserByUsername(username);

  const id = userDetails[0].id;
  const passwordValues = [password, id];

  try {
    await pool.query(
      `INSERT INTO passwords (password, user_id) VALUES ($1, $2)`,
      passwordValues
    );
  } catch (err) {
    return err;
  }

  // return new user's id
  return userDetails[0];
}

// USER UPDATE FUNCTIONS

async function updateUserPassword(id, newPassword) {
  const values = [id, newPassword];

  try {
    await pool.query(
      `UPDATE passwords SET password=$2 WHERE user_id=$1`,
      values
    );
  } catch (err) {
    console.error(err);
  }
}

async function updateUserEmail(id, newEmail) {
  const values = [id, newEmail];

  try {
    await pool.query(`UPDATE users SET email=$2 WHERE id=$1`, values);
  } catch (err) {
    console.error(err);
  }
}

async function updateUserLastLogin(id) {
  const values = [id, new Date()];
  console.log(values);
  try {
    await pool.query(`UPDATE users SET last_login=$2 WHERE id=$1`, values);
  } catch (err) {
    return err;
  }
}

// USER DELETE FUNCTIONS

async function deleteUser(id) {
  const values = [id];
  try {
    await pool.query(`DELETE FROM users WHERE id=$1`, values);
  } catch (err) {
    console.error(err);
  }
}

async function deletePassword(userId) {
  const values = [userId];
  try {
    await pool.query(`DELETE FROM passwords WHERE user_id=$1`, values);
  } catch (err) {
    console.error(err);
  }
}

// TAB READ FUNCTIONS

async function getAllTabs() {
  const { rows } = await pool.query(`SELECT * FROM tabs`);
  return rows;
}

async function getTabUser(id) {
  const values = [id];
  const { rows } = await pool.query(
    `SELECT user_id FROM tabs WHERE id=$1`,
    values
  );
  return rows[0].user_id;
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
  return rows[0];
}

async function getTabsByArtist(artist) {
  const values = [artist];
  const { rows } = await pool.query(
    `SELECT * FROM tabs WHERE tab_artist=$1`,
    values
  );
  return rows;
}

async function getUserPassword(id) {
  const values = [id];
  const { rows } = await pool.query(
    `SELECT * FROM passwords WHERE user_id=$1`,
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

async function updateTabData(id, tabName, tabArtist, tuning, tab) {
  const modifiedAt = new Date();
  const values = [tabName, tabArtist, tuning, modifiedAt, tab, id];
  await pool.query(
    `UPDATE tabs
     SET tab_name = $1,
         tab_artist = $2,
         tuning = $3,
         modified_at = $4,
         tab = $5
     WHERE id = $6`,
    values
  );
  console.log(`tab updated.`);
}

async function updateTabName(id, name) {
  const values = [id, name];
  const tabData = await getTabById(id);
  if (!tabData[0]) {
    console.error(`Tab with id of ${id} does not exist. Update aborted.`);
    return;
  }
  await pool.query(`UPDATE tabs SET tab_name=$2 WHERE id=$1`, values);
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
  getUserPassword,
  insertUser,
  updateUserPassword,
  updateUserEmail,
  updateUserLastLogin,
  deleteUser,
  getAllTabs,
  getTabById,
  getTabsByArtist,
  getTabsByUser,
  getTabsByName,
  getTabUser,
  insertTab,
  updateTabData,
  updateTabName,
  updateTabArtist,
  updateTuning,
  updateTab,
  deleteTab,
};
