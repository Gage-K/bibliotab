import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { AxiosError } from "axios";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { tabService } from "../api/services/tabService";
import { DEFAULT_TAB } from "../shared/types/consts";

import Header from "../components/Header";
import Footer from "../components/Footer";
import PageWrapper from "../layouts/PageWrapper";
import { SkeletonText } from "../components/Skeleton";
import { TabType } from "../shared/types/tab.types";

export default function Dashboard() {
  const detailStyle =
    "p-3 dark:text-neutral-200 border-t border-neutral-300 dark:border-neutral-800 truncate";
  const buttonStyle =
    "w-full max-w-16 py-2 flex justify-center text-xs flex-none border border-transparent  rounded font-semibold hover:shadow-sm duration-150 ease-in-out";
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();

  const [allTabs, setAllTabs] = useState<TabType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function getTabs() {
    setIsLoading(true);
    try {
      const response = await tabService.getAll(axiosPrivate);
      setAllTabs(response.data.data);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
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
    setIsCreating(true);

    try {
      const response = await tabService.create(axiosPrivate, DEFAULT_TAB);
      if (response.status === 201) {
        const tabId = response.data.data.id;
        setIsCreating(false);
        navigate(`/editor/${tabId}`, { state: { tabId } });
      }
    } catch (err) {
      console.error("Error creating tab:", err);
      if (err instanceof AxiosError) {
        console.error("Error response:", err.response?.data);
      }
      setIsCreating(false);
    }
  }

  async function deleteTab(id: string) {
    setIsDeletingId(id);

    try {
      await tabService.delete(axiosPrivate, id);
      getTabs();
      setIsDeletingId(null);
    } catch (err) {
      console.error(err);
      setIsDeletingId(null);
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
              disabled={isCreating}
              className={`${isCreating
                ? "animate-pulse bg-indigo-400 hover:cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-400 hover:shadow-lg duration-150 ease-in-out hover:cursor-pointer"
                } text-xs py-4 h-fit px-3 rounded-md text-neutral-50 font-semibold`}>
              Create New Tab
            </button>
          </div>
          {isLoading ? (
            <>
              <SkeletonText />
              <SkeletonText />
            </>
          ) : allTabs.length === 0 ? (
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
                      key={tab.id}
                      className="grid grid-cols-4 text-neutral-700 font-normal">
                      <td className={detailStyle}>{tab.details.song}</td>
                      <td className={detailStyle}>{tab.details.artist}</td>
                      <td className={detailStyle}>{[...tab.details.tuning].reverse().join("")}</td>
                      <td className={`${detailStyle} flex flex-wrap gap-1`}>
                        <Link
                          to={`/editor/${tab.id}`}
                          className={`${buttonStyle} bg-neutral-800 text-neutral-50 hover:bg-neutral-400`}
                          viewTransition>
                          Edit
                        </Link>
                        <button
                          disabled={isDeletingId === tab.id}
                          onClick={() => deleteTab(tab.id)}
                          className={`${buttonStyle} text-neutral-500 dark:text-neutral-400 hover:bg-red-500 not-disabled:hover:text-red-50 hover:cursor-pointer disabled:bg-neutral-300 disabled:animate-pulse disabled:hover:cursor-not-allowed`}>
                          {isDeletingId === tab.id ? "Deleting" : "Delete"}
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
