import type { RolloutStatus } from "../types/index";

const STAGES: RolloutStatus[] = ["radius_only", "shadow", "polygon_only"];

const STAGE_CLASS: Record<RolloutStatus, string> = {
  radius_only: "filled-radius",
  shadow: "filled-shadow",
  polygon_only: "filled-polygon",
};

const STAGE_LABEL: Record<RolloutStatus, string> = {
  radius_only: "radius only",
  shadow: "shadow (both checks running)",
  polygon_only: "polygon only",
};

export function RolloutBadge({ status }: { status: RolloutStatus }) {
  const activeIndex = STAGES.indexOf(status);

  return (
    <div className="rollout-badge">
      <div className="rollout-segments">
        {STAGES.map((stage, i) => (
          <div
            key={stage}
            className={`rollout-segment ${i <= activeIndex ? STAGE_CLASS[status] : ""}`}
            title={stage}
          />
        ))}
      </div>
      <span className="rollout-label">{STAGE_LABEL[status]}</span>
    </div>
  );
}
