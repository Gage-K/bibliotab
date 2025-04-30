import { Link } from "react-router";
import Footer from "../components/Footer";
import Header from "../components/Header";
import PageWrapper from "../layouts/PageWrapper";
import {
  TextTSlash,
  Palette,
  CloudX,
  CursorClick,
} from "@phosphor-icons/react";

export default function Home() {
  const h2Style =
    "text-3xl font-semibold text-neutral-800 dark:text-neutral-200 my-8 py-4";
  const cardStyle = "max-w-full grid grid-cols-[1fr_6fr] gap-2";
  const cardText = "font-semibold dark:text-neutral-200";

  return (
    <>
      <Header />

      <main className="text-lg min-h-screen pb-16">
        <PageWrapper>
          <div className="text-center min-h-[75vh] grid place-items-center">
            <div className="container">
              <h1 className="text-5xl font-bold text-neutral-800 dark:text-neutral-200 pt-8 mb-10 ">
                Create{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600 dark:from-indigo-200 dark:to-indigo-400">
                  guitar tablature
                </span>{" "}
                with ease
              </h1>
              <p className="my-8 dark:text-neutral-200">
                Tablab is a free web application for creating guitar tablature
                that is minimalist and easy to use on any device.
              </p>
              <Link
                to="/register"
                className="px-4 py-2 bg-indigo-600 text-neutral-50 dark:text-neutral-200 rounded-sm hover:bg-indigo-400 duration-150 ease-in-out">
                Sign up
              </Link>
            </div>
          </div>
        </PageWrapper>

        <div className="pb-16">
          <PageWrapper>
            <h2 className={h2Style}>Why use tablab?</h2>

            <ul className="grid grid-cols-1 md:grid-cols-2 last:col-span-full gap-8">
              <li className={cardStyle}>
                <CursorClick
                  size={36}
                  className="p-2 rounded-md bg-indigo-600 text-neutral-50 dark:text-neutral-200"
                />
                <div className="flex flex-col justify-start gap-2">
                  <p className={cardText}>User-friendly interface</p>
                  <p className="dark:text-neutral-300">
                    Create tabs easily using a clean, minimalist design
                  </p>
                </div>
              </li>

              <li className={cardStyle}>
                <CloudX
                  size={36}
                  className="p-2 rounded-md bg-indigo-600 text-neutral-50"
                />
                <div className="flex flex-col justify-start gap-2">
                  <p className={cardText}>No installation required</p>
                  <p className="dark:text-neutral-300">
                    Just use your browser. No need to download any apps or
                    plugins
                  </p>
                </div>
              </li>

              <li className={cardStyle}>
                <TextTSlash
                  size={36}
                  className="p-2 rounded-md bg-indigo-600 text-neutral-50"
                />
                <div className="flex flex-col justify-start gap-2">
                  <p className={cardText}>ASCII clunkiness-free</p>
                  <p className="dark:text-neutral-300">
                    Say goodbye to writing tabs out in plaintext
                  </p>
                </div>
              </li>
            </ul>
          </PageWrapper>
        </div>

        <PageWrapper>
          <h2 className={h2Style}>Who is talab for?</h2>
          <ul className="list-disc list-outside pl-4 dark:text-neutral-200">
            <li>Guitarists who compose original music</li>
            <li>
              Teachers and students who need a simple way to write down songs,
              scales, and exercises
            </li>
            <li>Hobbyists transcribing their favorite songs</li>
          </ul>
        </PageWrapper>
      </main>
      <Footer />
    </>
  );
}
