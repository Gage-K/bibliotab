// REACT IMPORTS
import { useState } from "react";
import { nanoid } from "nanoid";

// STYLE IMPORTS
import "./App.css";

// COMPONENTS IMPORTS
import TabDetails from "./components/TabDetails";
import TabDisplay from "./components/TabDisplay";

// DATA IMPORTS
import defaultTab from "./data/defaultTab.json";

function App() {
  // constants for testing
  const tabDetails = defaultTab.tabDetails; // general details about tab
  const initTab = defaultTab.tab; // init testing notes for tab --> change later to empty init

  // states
  const [tab, setTab] = useState(initTab);
  const [position, setPosition] = useState(0); // position indicates place in array of tab, like a timestamp

  function updatePosition(pos) {
    setPosition((prevPos) => pos);
  }

  console.log(position);

  return (
    <>
      <TabDetails
        song={tabDetails.song}
        artist={tabDetails.artist}
        creator={tabDetails.creator}
        dateCreated={tabDetails.dateCreated}
        dateModified={tabDetails.dateModified}
        tuning={tabDetails.tuning}
      />
      <button onClick={() => updatePosition(position + 1)}>
        Update position
      </button>
      <TabDisplay
        tab={tab}
        position={position}
        updatePosition={updatePosition}
      />
    </>
  );
}

export default App;
