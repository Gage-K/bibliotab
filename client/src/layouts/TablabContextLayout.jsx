import { Outlet } from "react-router";
import { useState, createContext, useEffect } from "react";

import defaultTab from "../data/defaultTab.json";

import { nanoid } from "nanoid";

const TablabContext = createContext();
const test = "test";

export default function TablabContextLayout() {
  const [tabs, setTabs] = useState(
    () => JSON.parse(localStorage.getItem("allTabs")) || []
  );

  useEffect(() => {
    if (tabs.length === 0) {
      setTabs(defaultTab.allTabs); // Update state instead of just localStorage
    }
  }, []);

  function updateDetails(id, name, value) {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === id
          ? { ...tab, details: { ...tab.details, [name]: value } }
          : tab
      )
    );
  }

  function updateTab(id, newTab) {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => (tab.id === id ? { ...tab, tab: newTab } : tab))
    );
  }

  function createNewTab() {
    const newTab = {
      id: nanoid(),
      details: {
        song: "Untitled",
        artist: "Artist",
        creator: "",
        dateCreated: 20250101,
        dateModified: 20250101,
        tuning: ["E", "B", "G", "D", "A", "E"],
      },
      tab: [
        [
          {
            id: 1,
            notes: [
              {
                fret: 0,
                style: "none",
              },
              {
                fret: 0,
                style: "none",
              },
              {
                fret: 0,
                style: "none",
              },
              {
                fret: 0,
                style: "none",
              },
              {
                fret: 0,
                style: "none",
              },
              {
                fret: 0,
                style: "none",
              },
            ],
          },
        ],
      ],
    };

    setTabs((prevTabs) => [...prevTabs, newTab]);
  }

  function deleteTab(id) {
    setTabs((prevTabs) => prevTabs.filter((tab) => tab.id != id));
  }

  useEffect(() => {
    localStorage.setItem("allTabs", JSON.stringify(tabs));
  }, [tabs]);

  return (
    <TablabContext.Provider value={{ test }}>
      <Outlet />
    </TablabContext.Provider>
  );
}

export { TablabContext };
