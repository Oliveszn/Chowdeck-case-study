import type { City } from "../types/index";

interface Props {
  cities: City[];
  selectedId: number | null;
  onChange: (id: number) => void;
}

export function CitySelector({ cities, selectedId, onChange }: Props) {
  return (
    <div className="section">
      <label className="section-label">City</label>
      <select
        value={selectedId ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value="" disabled>
          Select a city
        </option>
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>
    </div>
  );
}
