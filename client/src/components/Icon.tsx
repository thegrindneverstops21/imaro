import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Alert02Icon,
  AlertCircleIcon,
  ArrowDown01Icon,
  Calendar01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  InformationCircleIcon,
  MoreVerticalIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  BedIcon,
  Cancel01Icon,
  FavouriteIcon,
  Menu01Icon,
  Notification01Icon,
  StarIcon,
  StarOffIcon,
  ThumbsUpIcon,
  RulerIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

const icons = {
  bell: Notification01Icon,
  plus: Add01Icon,
  arrowDown: ArrowDown01Icon,
  arrowLeft: ArrowLeft01Icon,
  arrowRight: ArrowRight01Icon,
  arrowUpRight: ArrowUpRight01Icon,
  clock: Clock01Icon,
  moreVertical: MoreVerticalIcon,
  calendar: Calendar01Icon,
  close: Cancel01Icon,
  checkCircle: CheckmarkCircle01Icon,
  infoCircle: InformationCircleIcon,
  alertTriangle: Alert02Icon,
  alertCircle: AlertCircleIcon,
  bed: BedIcon,
  ruler: RulerIcon,
  users: UserGroupIcon,
  heart: FavouriteIcon,
  menu: Menu01Icon,
  star: StarIcon,
  starOff: StarOffIcon,
  thumbsUp: ThumbsUpIcon,
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
