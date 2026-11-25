"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, PackageSearch, ShieldCheck, LogOut, UserCog, Gift, Eye, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";
import { AvatarDisplay } from "@/components/avatar-display";
import { NAV_HOVER_ICON } from "./nav-hover";

type GuestAccess = "guest" | "manager" | null;

// Asks the server whether this person currently holds a guest / access-manager
// grant (see app/api/admin-access/route.ts). Any failure means "show nothing".
async function fetchGuestAccess(): Promise<GuestAccess> {
  try {
    const res = await fetch("/api/admin-access", { cache: "no-store", credentials: "same-origin" });
    if (!res.ok) return null;
    const data = (await res.json()) as { access?: string | null };
    return data.access === "guest" || data.access === "manager" ? data.access : null;
  } catch {
    return null;
  }
}

export default function UserMenu() {
  const { data: session, isPending } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  // Standard SSR-hydration-safe "mounted" gate (see comment above render).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Does the owner currently let this person into the admin as a read-only
  // guest (or as someone who invites guests)? Only the server knows — it
  // checks the live grant, so this asks it rather than guessing from the
  // session. It's just for showing a shortcut; the admin pages enforce access
  // on their own. Asked on load and again whenever the menu opens, so a
  // revoke or an expiry removes the shortcut straight away.
  const userId = session?.user?.id;
  const [guestAccess, setGuestAccess] = useState<GuestAccess>(null);
  useEffect(() => {
    if (!userId || isAdmin) return;
    let cancelled = false;
    void fetchGuestAccess().then((access) => {
      if (!cancelled) setGuestAccess(access);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, isAdmin]);
  // Never show a shortcut for someone who has since signed out or is a real admin.
  const shownGuestAccess = userId && !isAdmin ? guestAccess : null;

  if (!mounted) {
    return (
      <span className="rounded-xl p-2" aria-hidden="true">
        <User className="h-5 w-5 text-foreground" />
      </span>
    );
  }

  if (!isPending && !session?.user) {
    return (
      <Link href="/sign-in" aria-label="Sign in" className={`${NAV_HOVER_ICON} p-2`}>
        <User className="h-5 w-5 text-foreground" />
      </Link>
    );
  }

  return (
    <>
      <DropdownMenu
        onOpenChange={(open) => {
          if (open && userId && !isAdmin) void fetchGuestAccess().then(setGuestAccess);
        }}
      >
        <DropdownMenuTrigger
          render={
            <button type="button" aria-label="Account menu" className={`${NAV_HOVER_ICON} overflow-hidden p-1`} />
          }
        >
          <AvatarDisplay
            image={session?.user?.image}
            name={session?.user?.name ?? "?"}
            className="h-7 w-7 text-xs"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[280px] p-2">
          <DropdownMenuItem
            className="items-start gap-3 rounded-md px-2 py-2.5"
            render={<Link href="/account" />}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700/10 text-primary">
              <UserCog className="h-4.5 w-4.5" />
            </span>
            <span className="flex flex-col gap-0.5 pt-0.5">
              <span className="text-sm font-semibold text-foreground">Account</span>
              <span className="text-xs text-muted-foreground">Manage your profile</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="items-start gap-3 rounded-md px-2 py-2.5"
            render={<Link href="/account/orders" />}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700/10 text-primary">
              <PackageSearch className="h-4.5 w-4.5" />
            </span>
            <span className="flex flex-col gap-0.5 pt-0.5">
              <span className="text-sm font-semibold text-foreground">Order history</span>
              <span className="text-xs text-muted-foreground">View your past orders</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="items-start gap-3 rounded-md px-2 py-2.5"
            render={<Link href="/account/referrals" />}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700/10 text-primary">
              <Gift className="h-4.5 w-4.5" />
            </span>
            <span className="flex flex-col gap-0.5 pt-0.5">
              <span className="text-sm font-semibold text-foreground">Invite friends</span>
              <span className="text-xs text-muted-foreground">Earn rewards for referrals</span>
            </span>
          </DropdownMenuItem>
          {shownGuestAccess && (
            <DropdownMenuItem
              className="items-start gap-3 rounded-md px-2 py-2.5"
              render={<Link href={shownGuestAccess === "manager" ? "/admin/guests" : "/admin"} />}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700/10 text-primary">
                {shownGuestAccess === "manager" ? <Users className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </span>
              <span className="flex flex-col gap-0.5 pt-0.5">
                <span className="text-sm font-semibold text-foreground">
                  {shownGuestAccess === "manager" ? "Manage guests" : "Guest admin"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {shownGuestAccess === "manager" ? "Invite and revoke guest access" : "Look around the admin (read-only)"}
                </span>
              </span>
            </DropdownMenuItem>
          )}
          {isAdmin && (
            <DropdownMenuItem
              className="items-start gap-3 rounded-md px-2 py-2.5"
              render={<Link href="/admin" />}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700/10 text-primary">
                <ShieldCheck className="h-4.5 w-4.5" />
              </span>
              <span className="flex flex-col gap-0.5 pt-0.5">
                <span className="text-sm font-semibold text-foreground">Admin dashboard</span>
                <span className="text-xs text-muted-foreground">Manage products &amp; orders</span>
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="items-start gap-3 rounded-md px-2 py-2.5"
            onClick={() => setConfirmOpen(true)}
            variant="destructive"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <LogOut className="h-4.5 w-4.5" />
            </span>
            <span className="flex flex-col gap-0.5 pt-0.5">
              <span className="text-sm font-semibold text-destructive">Sign out</span>
              <span className="text-xs text-destructive/70">Log out of your account</span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
            <DialogDescription>
              You&apos;ll need to sign in again to see your orders and wishlist.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                signOut();
                setConfirmOpen(false);
                router.push("/");
              }}
            >
              Sign out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
