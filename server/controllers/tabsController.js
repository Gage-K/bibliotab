const db = require("../db/queries");

async function getAllTabs(req, res) {
  const currentUser = req?.user.id;
  const tabs = await db.getTabsByUser(currentUser);
  res.json(tabs);
}

async function getTab(req, res) {
  const currentUser = req?.user.id;
  const { tabId } = req.params;
  const userId = await db.getTabUser(tabId);
  if (userId !== currentUser) {
    return res.status(403).json({ message: "You do not have access." });
  }
  const tab = await db.getTabById(tabId);
  console.log(tab);
  res.json(tab);
}

async function updateTab(req, res) {
  const currentUser = req?.user.id;
  const { tabId } = req.params;
  const userId = await db.getTabUser(tabId);
  if (userId !== currentUser) {
    return res.status(403).json({ message: "You do not have access." });
  }

  const { tabName, tabArtist, tuning, tab } = req.body;
  const newId = await db.updateTabData(tabId, tabName, tabArtist, tuning, tab);
  res.json(newId);
}

async function deleteTab(req, res) {
  const currentUser = req?.user.id;
  const { tabId } = req.params;
  const userId = await db.getTabUser(tabId);
  if (userId !== currentUser) {
    return res.status(403).json({ message: "You do not have access." });
  }
  await db.deleteTab(tabId);
  res.status(200).json({ message: "Tab successfully deleted" });
}

async function createTab(req, res) {
  const { tabName, tabArtist, tuning, tab } = req.body;
  console.log(req.body);
  const processedTuning = JSON.stringify(tuning);
  const processedTab = JSON.stringify(tab);
  console.log(processedTab);

  const currentUser = req?.user.id;
  const tabId = await db.insertTab(
    currentUser,
    tabName,
    tabArtist,
    processedTuning,
    processedTab
  );
  res.status(200).json({ message: "Tab created successfully", tabId: tabId });
}

module.exports = { getAllTabs, getTab, updateTab, createTab, deleteTab };
