import Footer from "../components/Footer";
import Header from "../components/Header";
import PageWrapper from "../layouts/PageWrapper";
import {
  NumberCircleOne,
  NumberCircleTwo,
  NumberCircleThree,
  TextTSlash,
  Globe,
  Palette,
  CloudX,
} from "@phosphor-icons/react";

export default function Home() {
  const h2Style = "text-3xl font-semibold text-neutral-800 mt-8 mb-4";
  const cardStyle =
    "w-full flex flex-col text-center place-items-center rounded-sm ";
  const cardText = "font-semibold my-2";
  return (
    <>
      <Header />

      <main className="text-lg">
        <PageWrapper>
          <div className="flex gap-8 flex-wrap md:flex-nowrap">
            <div className="align-start">
              <h1 className="text-5xl font-bold text-neutral-800 pt-8 mb-10 ">
                tablab
              </h1>
              <p>
                tablab is a free web application for creating guitar tablature
                that is minimalist and easy to use.
              </p>
            </div>
            <div className="min-w-96 w-full h-64 bg-neutral-600 rounded-md shadow-sm"></div>
          </div>
        </PageWrapper>

        <div className="clip-section bg-indigo-500 pb-16">
          <PageWrapper>
            <h2 className={h2Style}>Why use tablab?</h2>

            <ul className="flex flex-wrap md:flex-nowrap gap-8 ">
              <li className={cardStyle}>
                <Palette size={40} />
                <p className={cardText}>User-friendly interface</p>
                <p>Create tabs easily using a clean, minimalist design</p>
              </li>

              <li className={cardStyle}>
                <CloudX size={40} />
                <p className={cardText}>No installation required</p>
                <p>
                  Just use your browser—no need to download any apps or plugins
                </p>
              </li>

              <li className={cardStyle}>
                <TextTSlash size={40} />
                <p className={cardText}>ASCII clunkiness-free</p>
                <p>Say goodbye to writing tabs out in plaintext</p>
              </li>
            </ul>
          </PageWrapper>
        </div>

        <PageWrapper>
          <h2 className={h2Style}>Who is talab for?</h2>
          <ul className="list-disc list-inside">
            <li>Guitarists who compose original music</li>
            <li>
              Teachers and students who need a simple way to write down songs,
              scales, and exercises
            </li>
            <li>Hobbyists transcribing their favorite songs</li>
          </ul>

          <h2 className={h2Style}>Get started</h2>
          <p>Jump into tablab</p>
        </PageWrapper>
      </main>

      <Footer />
    </>
  );
}
