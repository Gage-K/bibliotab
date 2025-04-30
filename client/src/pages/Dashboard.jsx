import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { nanoid } from "nanoid";
import axios from "../api/axios";

import Header from "../components/Header";
import Footer from "../components/Footer";
import PageWrapper from "../layouts/PageWrapper";
import useAuth from "../hooks/useAuth";

const TABS_URL = "/api/tabs";
const DEFAULT_TAB = {
  tabName: "Untitled",
  tabArtist: "Untitled",
  tuning: ["E", "B", "G", "D", "A", "E"],
  tab: [
    [
      {
        id: 1,
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
      },
    ],
  ],
};

export default function Dashboard() {
  const detailStyle =
    "p-3 dark:text-neutral-200 border-t border-neutral-300 dark:border-neutral-800 truncate";
  const buttonStyle =
    "w-full max-w-16 py-2 flex justify-center text-xs flex-none border border-transparent  rounded font-semibold hover:shadow-sm duration-150 ease-in-out";
  const { auth } = useAuth();
  const navigate = useNavigate();

  const [allTabs, setAllTabs] = useState([]);

  async function getTabs() {
    try {
      const response = await axios.get(TABS_URL, {
        headers: {
          "Content-Type": "application/json",
          Authorization: auth.accessToken,
        },
      });
      setAllTabs(response.data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    getTabs();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  async function createTab() {
    try {
      const response = await axios.post(TABS_URL, JSON.stringify(DEFAULT_TAB), {
        headers: {
          "Content-Type": "application/json",
          Authorization: auth.accessToken,
        },
        withCredentials: true,
      });
      if (response.status === 200) {
        const tabId = response.data.tabId;
        navigate(`/editor/${tabId}`, { tabId: tabId });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteTab(id) {
    try {
      const URL = TABS_URL + "/" + id;
      const response = await axios.delete(URL, {
        headers: {
          "Content-Type": "application/json",
          Authorization: auth.accessToken,
        },
        withCredentials: true,
      });
      getTabs();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pb-16">
        <PageWrapper>
          <div className="db-head-wrapper flex justify-between flex-wrap items-end">
            <h1 className="text-5xl font-bold text-neutral-800 dark:text-neutral-200 mt-8">
              Tabs
            </h1>
            <button
              onClick={createTab}
              className="text-xs py-4 h-fit px-3 rounded-md bg-neutral-800 text-neutral-50 hover:bg-neutral-400 hover:shadow-lg duration-150 ease-in-out hover:cursor-pointer">
              Create New Tab
            </button>
          </div>

          {allTabs.length === 0 ? (
            <div className="my-10 p-4 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm grid place-items-center gap-y-2">
              <h2 className="text-md dark:text-neutral-200">No current tabs</h2>
            </div>
          ) : (
            <div className="border border-neutral-300 dark:border-neutral-800 rounded my-10">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-200 rounded-sm">
                  <tr className="grid grid-cols-4">
                    <th className="p-3 font-semibold text-left">Title</th>
                    <th className="p-3 font-semibold text-left">Artist</th>
                    <th className="p-3 font-semibold text-left">Tuning</th>
                    <th className="p-3 font-semibold text-left hidden">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allTabs.map((tab) => (
                    <tr
                      key={nanoid()}
                      className="grid grid-cols-4 text-neutral-700 font-normal">
                      <td className={detailStyle}>{tab.tab_name}</td>
                      <td className={detailStyle}>{tab.tab_artist}</td>
                      <td className={detailStyle}>{tab.tuning.toReversed()}</td>
                      <td className={`${detailStyle} flex flex-wrap gap-1`}>
                        <Link
                          to={`/editor/${tab.id}`}
                          className={`${buttonStyle} bg-neutral-800 text-neutral-50 hover:bg-neutral-400`}
                          viewTransition>
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteTab(tab.id)}
                          className={`${buttonStyle} text-neutral-500 dark:text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500 dark:hover:text-red-50 hover:border-red-500 hover:cursor-pointer`}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PageWrapper>
      </main>
      <Footer />
    </>
  );
}
