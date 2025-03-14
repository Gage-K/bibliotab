import { TablabContext } from "../layouts/TablabContextLayout";
import { useContext } from "react";
import { Link } from "react-router";
import { nanoid } from "nanoid";

export default function Dashboard() {
  const { tabs, createNewTab, deleteTab } = useContext(TablabContext);
  const detailStyle = "p-3 border-t border-neutral-300 truncate";
  const buttonStyle =
    "w-full max-w-16 py-1 flex justify-center text-xs flex-none border border-transparent  rounded font-semibold hover:shadow-sm duration-150 ease-in-out";

  const cellStyle = "p-3 truncate";
  return (
    <>
      <div className="db-head-wrapper flex justify-between flex-wrap gap-4">
        <h1 className="text-5xl font-bold text-neutral-800">Dashboard</h1>
        <button
          onClick={createNewTab}
          className="text-xs py-4 border border-opacity-100 px-3 rounded-md bg-neutral-800 text-neutral-50 hover:bg-neutral-400 hover:shadow-lg duration-150 ease-in-out">
          Create New Tab
        </button>
      </div>

      <div className="border border-neutral-300 rounded my-10">
        <table className="w-full">
          <thead className="bg-neutral-50  rounded-sm">
            <tr className="grid grid-cols-4">
              <th className="p-3 font-semibold text-left">Title</th>
              <th className="p-3 font-semibold text-left">Artist</th>
              <th className="p-3 font-semibold text-left">Tuning</th>
              <th className="p-3 font-semibold text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tabs.map((tab) => (
              <tr
                key={nanoid()}
                className="grid grid-cols-4 text-neutral-700 font-normal">
                <td className={detailStyle}>{tab.details.song}</td>
                <td className={detailStyle}>{tab.details.artist}</td>
                <td className={detailStyle}>
                  {tab.details.tuning.toReversed()}
                </td>
                <td className={`${detailStyle} flex flex-wrap gap-1`}>
                  <Link
                    to={`/editor/${tab.id}`}
                    className={`${buttonStyle} bg-neutral-800 text-neutral-50 hover:bg-neutral-400`}
                    viewTransition>
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteTab(tab.id)}
                    className={`${buttonStyle} text-neutral-500 hover:bg-red-50 hover:text-red-500 hover:border-red-500`}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
