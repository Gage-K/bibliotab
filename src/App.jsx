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
      <TabDisplay tab={tab} />
    </>
  );
}

export default App;
