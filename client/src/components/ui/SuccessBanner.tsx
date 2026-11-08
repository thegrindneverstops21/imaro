import type { ReactNode } from "react";
import { Icon } from "../Icon";

export function SuccessBanner({ children }: { children: ReactNode }) {
  return (
    <div className="success-banner" role="status">
      <Icon name="checkCircle" />
      <div>{children}</div>
    </div>
  );
}
