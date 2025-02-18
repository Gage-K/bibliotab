// REACT IMPORTS
import { useState } from "react";
import { nanoid } from "nanoid";

// STYLE IMPORTS
import "./App.css";

// COMPONENTS IMPORTS
import TabDetails from "./components/TabDetails";

// DATA IMPORTS
import { defaultTab } from "./data/defaultTab.json";

function App() {
  // constants for testing
  const tabDetails = defaultTab.tabDetails; // general details about tab
  const initTab = defaultTab.tab; // init testing notes for tab --> change later to empty init

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
    </>
  );
}

export default App;
