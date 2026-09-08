import Link from "next/link";
import { CompassIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <CompassIcon className="size-6 text-muted-foreground" />
      </div>
      <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist, or may have moved. Double-check
        the link, or head back to the catalog.
      </p>
      <Button render={<Link href="/" />} className="mt-8">
        Back to home
      </Button>
    </div>
  );
}
