// REACT IMPORTS
import { useState, createContext, useEffect, useContext } from "react";
import { nanoid } from "nanoid";
import { useParams } from "react-router";

// STYLE IMPORTS
import "../App.css";

// COMPONENTS IMPORTS
import TabDetails from "./TabDetails";
import TabDisplay from "./TabDisplay";
import Editor from "./Editor";
import Header from "./Header";

// DATA IMPORTS
import { TablabContext } from "../layouts/TablabContextLayout";
import PageWrapper from "../layouts/PageWrapper";

const TabContext = createContext();

export default function MainTabEditor() {
  const { tabId } = useParams();
  const { updateTab } = useContext(TablabContext);

  useEffect(() => {
    const storedTabs = JSON.parse(localStorage.getItem("allTabs"));
    if (storedTabs && storedTabs.length > 0) {
      // Find the tab that matches the tabId
      const selectedTab = storedTabs.find((tab) => tab.id === tabId);
      setTabData(selectedTab || null);
      setTab(selectedTab.tab || null);
    }
  }, [tabId]);

  // CONSTANTS (FOR TESTING)

  // STATES

  const [tabData, setTabData] = useState({});
  const isLoading = Object.keys(tabData).length === 0;
  const [tab, setTab] = useState(tabData.tab);
  const [position, setPosition] = useState({ measure: 0, frame: 0 });
  const [editorIsOpen, setEditorIsOpen] = useState(false);

  // HOOKS

  useEffect(() => {
    updateTab(tabId, tab);
  }, [tab]);

  // FUNCTIONS

  function handleOpeningEditor() {
    setEditorIsOpen((prev) => !prev);
  }

  function isExistingPosition(measure, frame) {
    return tab[measure] != undefined ? tab[measure][frame] != undefined : false;
  }

  function isOnlyFrame(measure) {
    return tab[measure].length === 1;
  }

  function isOnlyMeasure() {
    return tab.length === 1;
  }
  /*
  function isLastFrame(measure, frame) {
    return tab[measure].length - 1 === frame;
  }*/

  function updatePosition(measure, frame) {
    // If position exists, update it
    if (isExistingPosition(measure, frame)) {
      setPosition({ measure, frame });
      return;
    }

    // Handle moving forward past the last frame in a measure
    if (frame >= tab[measure]?.length) {
      const nextMeasure = measure + 1;
      if (nextMeasure < tab.length) {
        setPosition({ measure: nextMeasure, frame: 0 });
      }
      return;
    }

    // Handle moving backward before the first frame in a measure
    if (frame < 0) {
      const prevMeasure = measure - 1;
      if (prevMeasure >= 0) {
        setPosition({
          measure: prevMeasure,
          frame: tab[prevMeasure]?.length - 1 || 0, // Move to the last frame of the previous measure
        });
      }
      return;
    }
  }

  function getEmptyFrame() {
    return {
      id: nanoid(),
      notes: [
        {
          fret: -2,
          style: "none",
        },
        {
          fret: -2,
          style: "none",
        },
        {
          fret: -2,
          style: "none",
        },
        {
          fret: -2,
          style: "none",
        },
        {
          fret: -2,
          style: "none",
        },
        {
          fret: -2,
          style: "none",
        },
      ],
    };
  }

  function getTabByLocation(measure, frame) {
    return tab[measure][frame];
  }

  function addNewMeasure(measure) {
    const newMeasure = [getEmptyFrame()];
    // if measure is -1, create a new tab with the empty measure placed at the start
    // otherwise, slice the tab and place new measure there
    const updatedTab =
      measure === -1
        ? [newMeasure, ...tab]
        : [...tab.slice(0, measure), newMeasure, ...tab.slice(measure)];

    setTab(updatedTab);
    measure === -1 ? updatePosition(0, 0) : updatePosition(measure, 0);
  }

  function addNewFrame(measure, frame, isEmptyTab) {
    // accepts a position and whether the tab to be added should be empty
    // position where new tab is added is always tab[pos + 1]
    // if tab should be empty, call getEmptyFrame()
    // if tab should not be empty, call getExistingTab(pos) and update its id
    // add new tab to tab
    const newTab = isEmptyTab
      ? getEmptyFrame()
      : { ...getTabByLocation(measure, frame), id: nanoid() };

    const updatedTab = tab.map((prevMeasure, i) =>
      i === measure
        ? [
            ...prevMeasure.slice(0, frame + 1),
            newTab,
            ...prevMeasure.slice(frame + 1),
          ]
        : prevMeasure
    );

    setTab(updatedTab);

    updatePosition(measure, frame + 1);
  }

  function deleteMeasure(measure) {
    // prevents deletion when it is the only measure
    if (isOnlyMeasure()) {
      return;
    }
    setTab((prev) => prev.filter((prevMeasure, index) => index != measure));
    updatePosition(measure - 1, tab[measure - 1]?.length - 1);
  }

  function deleteFrame(frame, measure) {
    if (isOnlyFrame(measure)) {
      if (isOnlyMeasure()) {
        // prevents deletion when it is the only frame of the only measure
        return;
      } else {
        // else if it is the only frame in the measure, delete the whole measure
        deleteMeasure(measure);
        return;
      }
    }

    // otherwise, only delete the frame at the requested position
    setTab((prev) =>
      prev.map((prevMeasure, i) =>
        i === measure
          ? prevMeasure.filter((prevFrame, j) => j != frame)
          : prevMeasure
      )
    );

    // if position after deletion exists, move there; if not, move backwards in position

    isExistingPosition(measure, frame + 1)
      ? updatePosition(measure, frame)
      : isExistingPosition(measure + 1, 0)
      ? updatePosition(measure + 1, 0)
      : updatePosition(measure, frame - 1);
  }

  function updateTabData(measure, index, formData) {
    // make changes to tab based on formdata
    setTab(
      tab.map((prevMeasure, measureIndex) =>
        prevMeasure.map((frame, frameIndex) =>
          frameIndex === index && measureIndex === measure
            ? { id: nanoid(), notes: formData }
            : frame
        )
      )
    );
  }

  return (
    <>
      <Header />
      <PageWrapper>
        {!isLoading && (
          <TabContext.Provider value={tabData}>
            <main className="mx-auto h-full">
              <div className="editor-top h-full">
                <TabDetails />
              </div>
              <Editor
                tab={tab}
                position={position}
                editorIsOpen={editorIsOpen}
                addNewFrame={addNewFrame}
                addNewMeasure={addNewMeasure}
                deleteFrame={deleteFrame}
                deleteMeasure={deleteMeasure}
                getEmptyFrame={getEmptyFrame}
                handleOpeningEditor={handleOpeningEditor}
                updatePosition={updatePosition}
                updateTabData={updateTabData}
              />

              <TabDisplay
                tab={tab}
                position={position}
                updatePosition={updatePosition}
                addNewFrame={addNewFrame}
                addNewMeasure={addNewMeasure}
                tuning={tabData.details.tuning}
              />
            </main>
          </TabContext.Provider>
        )}
      </PageWrapper>
    </>
  );
}

export { TabContext };
