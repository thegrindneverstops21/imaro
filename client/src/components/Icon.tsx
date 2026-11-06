import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Cancel01Icon,
  FavouriteIcon,
  Menu01Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";

const icons = {
  bell: Notification01Icon,
  plus: Add01Icon,
  arrowDown: ArrowDown01Icon,
  arrowLeft: ArrowLeft01Icon,
  arrowRight: ArrowRight01Icon,
  arrowUpRight: ArrowUpRight01Icon,
  close: Cancel01Icon,
  heart: FavouriteIcon,
  menu: Menu01Icon,
};

// The enclosing control supplies the accessible label; these icons are decorative.
export function Icon({ name }: { name: keyof typeof icons }) {
  return (
    <HugeiconsIcon
      icon={icons[name]}
      size={20}
      strokeWidth={1.5}
      className="ui-icon"
      aria-hidden="true"
      focusable="false"
    />
  );
}
