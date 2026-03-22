import { Outlet } from "react-router";
import Header from "../components/Header";

export default function AppLayoutNoFooter() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-16">
        <Outlet />
      </main>
    </>
  );
}
