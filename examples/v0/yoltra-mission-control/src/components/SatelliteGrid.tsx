import { store } from "../state/store";

import { SatelliteCard } from "./SatelliteCard";

// The fleet roster is fixed, so the grid reads it once and never subscribes.
// Only the individual cards re-render as their satellite's data changes.
const roster = store.getState().fleet.satellites.map((s, index) => ({
  index,
  id: s.id,
  name: s.name,
}));

export function SatelliteGrid() {
  return (
    <div className="sat-grid">
      {roster.map((s) => (
        <SatelliteCard key={s.id} index={s.index} id={s.id} name={s.name} />
      ))}
    </div>
  );
}
