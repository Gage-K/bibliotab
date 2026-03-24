import { Link } from "react-router";
import { ArrowRight, GithubLogo } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TabEditorProvider } from "../context/tabEditorProvider";
import Editor from "../components/Editor";
import TabDisplay from "../components/TabDisplay";
import useTypedAuth from "../hooks/useTypedAuth";
import { createEmptyFrame } from "../utils/tabOperations";
import type { TabBodyType, EditorDetailsType } from "../shared/types/tab.types";

const DEMO_TAB: TabBodyType = [
  [createEmptyFrame(), createEmptyFrame(), createEmptyFrame(), createEmptyFrame()],
  [createEmptyFrame(), createEmptyFrame(), createEmptyFrame(), createEmptyFrame()],
];

const DEMO_DETAILS: EditorDetailsType = {
  id: "demo",
  artist: "",
  song: "Try it out",
  tuning: ["E", "B", "G", "D", "A", "E"],
};

export default function Home() {
  const { auth } = useTypedAuth();
  const isLoggedIn = !!auth.user;

  return (
    <div className="flex flex-col items-center px-4 py-16 gap-12">
      <div className="max-w-lg w-full text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">bibliotab</h1>
        <p className="text-muted-foreground text-lg">
          Free guitar tablature editor that runs in your browser.
        </p>
        <div className="flex justify-center gap-3">
          {isLoggedIn ? (
            <Button asChild size="lg">
              <Link to="/dashboard">
                Go to dashboard
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link to="/register">
                  Get started
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">Log in</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="w-full max-w-3xl">
        <CardContent className="p-4">
          <TabEditorProvider demoData={{ tab: DEMO_TAB, details: DEMO_DETAILS }}>
            <Editor />
            <TabDisplay />
          </TabEditorProvider>
        </CardContent>
      </Card>

      <Separator className="max-w-3xl w-full" />

      <a
        href="https://github.com/Gage-K/bibliotab/issues"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <GithubLogo className="size-4" />
        Report an issue
      </a>
    </div>
  );
}
