import SearchButton from "./SearchButton";
import WishlistButton from "./WishlistButton";
import CartButton from "./CartButton";
import UserMenu from "./UserMenu";
import { ThemeToggle } from "@/components/theme-toggle";

export default function NavbarActions() {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <div className="hidden sm:contents">
        <SearchButton />
      </div>
      <ThemeToggle />
      {/* On mobile these live in the bottom tab bar instead — showing them
          here too would just duplicate navigation that's already one thumb
          away. `contents` (rather than a plain block wrapper) keeps these
          as direct children of this flex row when visible, which matters:
          a wrapper div here pulls the Link out of the flex item box model,
          reverting it to a default inline anchor, that's what was making
          the hover highlight render as a stretched rectangle instead of a
          square, and throwing off the notification badge's positioning. */}
      <div className="hidden sm:contents">
        <WishlistButton />
      </div>
      <div className="hidden sm:contents">
        <CartButton />
      </div>
      <div className="hidden sm:contents">
        <UserMenu />
      </div>
    </div>
  );
}
