// REACT IMPORTS
import { useState, createContext, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import { useParams } from "react-router";

// STYLE IMPORTS
import "../App.css";

// COMPONENTS IMPORTS
import TabDetails from "./TabDetails";
import TabDisplay from "./TabDisplay";
import Editor from "./Editor";
import Header from "./Header";
import useAuth from "../hooks/useAuth";
import axios from "../api/axios";
import PageWrapper from "../layouts/PageWrapper";

const TabContext = createContext();
const TAB_URL = "/api/tabs";

export default function MainTabEditor() {
  const { tabId } = useParams();
  const { auth } = useAuth();

  // STATES
  const [tab, setTab] = useState([]);
  const [details, setDetails] = useState({});
  const isLoading = Object.keys(tab).length === 0;
  const [position, setPosition] = useState({ measure: 0, frame: 0 });
  const [editorIsOpen, setEditorIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  function updateDetails(name, value) {
    setDetails((prevTab) => ({ ...prevTab, [name]: value }));
    setIsEditing(true);
  }

  // HOOKS

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const getTab = async () => {
      try {
        const URL = TAB_URL + "/" + tabId;
        const response = await axios.get(URL, {
          headers: {
            "Content-Type": "application/json",
            Authorization: auth.accessToken,
          },
        });
        const data = response.data[0];
        const details = {
          id: data.id,
          artist: data.tab_artist,
          song: data.tab_name,
          tuning: data.tuning,
        };
        const tabData = data.tab;
        setDetails(details);
        setTab(tabData);
      } catch (err) {
        console.error(err);
      }
    };

    getTab();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // FUNCTIONS

  async function saveChanges() {
    const data = {
      tabId: details.id,
      tabName: details.song,
      tabArtist: details.artist,
      tuning: details.tuning,
      tab: tab,
    };

    try {
      const URL = TAB_URL + "/" + tabId;
      const response = await axios.put(URL, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: auth.accessToken,
        },
        withCredentials: true,
      });
    } catch (err) {
      console.error(err);
    }

    setIsEditing(false);
  }

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

  function isLastFrame(measure, frame) {
    return tab[measure].length - 1 === frame;
  }

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

    setIsEditing(true);
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

    setIsEditing(true);
  }

  function deleteMeasure(measure) {
    // prevents deletion when it is the only measure
    if (isOnlyMeasure()) {
      return;
    }
    setTab((prev) => prev.filter((prevMeasure, index) => index != measure));
    updatePosition(measure - 1, tab[measure - 1]?.length - 1);
    setIsEditing(true);
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

    setIsEditing(true);
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
    setIsEditing(true);
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pb-16">
        <PageWrapper>
          {!isLoading && (
            <TabContext.Provider value={tab}>
              <div className="mx-auto h-full">
                <div className="editor-top h-full">
                  <TabDetails details={details} updateDetails={updateDetails} />
                </div>

                {
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
                    isEditing={isEditing}
                    saveChanges={saveChanges}
                  />
                }

                <TabDisplay
                  tab={tab}
                  position={position}
                  updatePosition={updatePosition}
                  addNewFrame={addNewFrame}
                  addNewMeasure={addNewMeasure}
                  tuning={details.tuning}
                />
              </div>
            </TabContext.Provider>
          )}
        </PageWrapper>
      </main>
    </>
  );
}

export { TabContext };
