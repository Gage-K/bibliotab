import { TablabContext } from "../layouts/TablabContextLayout";
import { Fragment, useContext } from "react";
import { Link } from "react-router";

export default function Dashboard() {
  const { tabs, createNewTab, deleteTab } = useContext(TablabContext);
  return (
    <div>
      <button onClick={createNewTab}>Create New Tab</button>

      {tabs.map((tab) => (
        <Fragment key={tab.details.id}>
          <Link to={`/editor/${tab.id}`}>
            <div className="db-list-item">
              <p>{tab.details.song}</p>
              <p>{tab.details.artist}</p>
              <p>{tab.details.tuning.toReversed()}</p>
              <p>{tab.id}</p>
            </div>
          </Link>
          <button onClick={() => deleteTab(tab.id)}>Delete</button>
        </Fragment>
      ))}
    </div>
  );
}
