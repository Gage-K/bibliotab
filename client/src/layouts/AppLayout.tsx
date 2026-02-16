import { Outlet } from "react-router";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AppLayout() {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-16">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
