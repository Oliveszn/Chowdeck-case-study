import type { DeliveryCheckResult } from "../types/index.js";

interface Props {
  lat: string;
  lng: string;
  onLatChange: (v: string) => void;
  onLngChange: (v: string) => void;
  onRunCheck: () => void;
  result: DeliveryCheckResult | null;
  disabled: boolean;
}

export function TestAddressPanel({
  lat,
  lng,
  onLatChange,
  onLngChange,
  onRunCheck,
  result,
  disabled,
}: Props) {
  const mismatch =
    result?.polygonResult !== null &&
    result?.polygonResult !== undefined &&
    result.radiusResult !== result.polygonResult;

  return (
    <div className="section">
      <label className="section-label">Test address</label>
      <input
        data-mono="true"
        placeholder="lat"
        value={lat}
        onChange={(e) => onLatChange(e.target.value)}
      />
      <input
        data-mono="true"
        placeholder="lng"
        value={lng}
        onChange={(e) => onLngChange(e.target.value)}
      />
      <button onClick={onRunCheck} disabled={disabled}>
        Run delivery check
      </button>

      {result && (
        <div className="result-panel">
          <div className="result-row">
            <span>radius_result</span>
            <span>{String(result.radiusResult)}</span>
          </div>
          <div className="result-row">
            <span>polygon_result</span>
            <span>{String(result.polygonResult)}</span>
          </div>
          <div className={`result-row ${mismatch ? "mismatch" : ""}`}>
            <span>{mismatch ? "MISMATCH →" : "decided by"}</span>
            <span>{result.decisionSource}</span>
          </div>
          <div className="result-row">
            <span>deliverable</span>
            <span>{String(result.deliverable)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
