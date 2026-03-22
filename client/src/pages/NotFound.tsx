import { Link } from "react-router";
import PageWrapper from "../layouts/PageWrapper";

export default function NotFound() {
  const darkButtonStyle =
    "bg-neutral-800 text-neutral-50 border border-neutral-800 px-8 py-2 w-64 place-items-center grid rounded-sm font-semibold hover:bg-neutral-700 duration-150 ease-in-out";
  const lightButtonStyle =
    "bg-neutral-50 text-neutral-800 border border-neutral-200 px-8 py-2 w-64 place-items-center grid rounded-sm font-semibold hover:bg-neutral-100 duration-150 ease-in-out";
  return (
    <PageWrapper>
      <h1 className="text-5xl font-bold text-neutral-800 pt-8 mb-10">
        Page not found!
      </h1>
      <div className="p-4 bg-neutral-100 border border-neutral-200 rounded-sm grid place-items-center gap-y-2 ">
        <p className="font-semibold mb-8">
          It looks like the page you were trying to view is broken or
          doesn&apos;t exist anymore.
        </p>
        <Link to="/dashboard" className={darkButtonStyle}>
          View Tabs
        </Link>
        <Link to="/" className={lightButtonStyle}>
          Home
        </Link>
      </div>
    </PageWrapper>
  );
}
