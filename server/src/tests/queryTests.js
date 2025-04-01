const db = require("../db/queries");

async function testGetAllUsers() {
  console.log(await db.getAllUsers());
}

async function testGetUserByUsername(username) {
  const data = await db.getUserByUsername(username);
  console.log("GET BY USERNAME");

  console.log(data);
  if (!data) {
    return console.error("User does not exist!");
  }
  console.log(data.id);
}

function testRunning() {
  console.log("Tests are running!");
}

async function testInsert(username, email, password) {
  const data = await db.insertUser(username, email, password);
  console.log(data);
}

async function testUpdateUserPassword(id, newPassword) {
  db.updateUserPassword(id, newPassword);
}

async function testDeleteUser(id) {
  db.deleteUser(id);
}

async function runTests() {
  testRunning();
}

module.exports = {
  testRunning,
  testGetAllUsers,
  testGetUserByUsername,
  testInsert,
  testUpdateUserPassword,
  testDeleteUser,
  runTests,
};
