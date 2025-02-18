// REACT IMPORTS
import { useState } from "react";
import { nanoid } from "nanoid";

// STYLE IMPORTS
import "./App.css";

// COMPONENTS IMPORTS
import TabDetails from "./components/TabDetails";
import TabDisplay from "./components/TabDisplay";
import TabForm from "./components/TabForm";

// DATA IMPORTS
import defaultTab from "./data/defaultTab.json";

function App() {
  // constants for testing
  const tabDetails = defaultTab.tabDetails; // general details about tab
  const initTab = defaultTab.tab; // init testing notes for tab --> change later to empty init

  // states
  const [tab, setTab] = useState(initTab);
  const [position, setPosition] = useState(0); // position indicates place in array of tab, like a timestamp

  function tabPositionExists(pos) {
    // checks if requested position in tab exists
    return pos < tab.length && pos >= 0;
  }

  function updatePosition(pos) {
    if (tabPositionExists(pos)) {
      setPosition(pos);
    }
  }

  function updateTabData(pos, formData) {
    setTab((prev) =>
      prev.map((tabItem, index) =>
        index === pos ? { id: nanoid(), notes: formData } : tabItem
      )
    );
  }

  return (
    <>
      <main>
        <TabDetails
          song={tabDetails.song}
          artist={tabDetails.artist}
          creator={tabDetails.creator}
          dateCreated={tabDetails.dateCreated}
          dateModified={tabDetails.dateModified}
          tuning={tabDetails.tuning}
        />
        <TabForm tab={tab} updateTabData={updateTabData} position={position} />
        <button onClick={() => updatePosition(position - 1)}>
          Previous position
        </button>
        <button onClick={() => updatePosition(position + 1)}>
          Next position
        </button>
        <TabDisplay
          tab={tab}
          position={position}
          updatePosition={updatePosition}
        />
      </main>
    </>
  );
}

export default App;
