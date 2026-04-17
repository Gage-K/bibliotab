import { Link } from "react-router";
import PageWrapper from "../layouts/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <PageWrapper>
      <h1 className="text-5xl font-bold text-foreground pt-8 mb-10">
        Page not found!
      </h1>
      <Card>
        <CardContent className="grid place-items-center gap-y-2">
          <p className="font-semibold mb-8">
            It looks like the page you were trying to view is broken or
            doesn&apos;t exist anymore.
          </p>
          <Button asChild className="w-64">
            <Link to="/dashboard">View Tabs</Link>
          </Button>
          <Button asChild variant="outline" className="w-64">
            <Link to="/">Home</Link>
          </Button>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
