// Shown to visitors instead of the whole site while maintenance mode is on
// (Admin > Settings). Deliberately plain: no database, no navbar.
export default function MaintenanceScreen({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <meta name="robots" content="noindex" />
      <svg viewBox="12 4 40 42" className="size-16" aria-hidden="true">
        <path
          d="M15.4 42.8C14.2 36 14.4 28 20 21.5C24 17.5 30 15.5 36 14.8C40 14.4 44 13.4 48 11.3C49 19 48.5 27 44 33C41 37 37 39 33.3 39.2C28 39.6 22 39.8 15.4 42.8Z"
          className="fill-[#265A43] dark:fill-[#A5BBA1]"
        />
        <path
          d="M32.4 15.4C31.6 11 33.4 8 38.6 7"
          fill="none"
          strokeWidth="2.3"
          strokeLinecap="round"
          className="stroke-[#265A43] dark:stroke-[#A5BBA1]"
        />
      </svg>
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">We&apos;ll be back soon</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        {message.trim() || "EcoFurnish is getting some care. Please check back shortly."}
      </p>
    </main>
  );
}
