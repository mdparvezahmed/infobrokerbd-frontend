import L from "leaflet";

export { DEFAULT_CENTER, DEFAULT_ZOOM } from "./constants";

// OpenStreetMap's own tiles are free with attribution but meant for moderate traffic.
// For production scale, set NEXT_PUBLIC_MAP_TILE_URL to a provider/self-hosted tile server.
export const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ??
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function addBaseLayer(map: L.Map) {
  L.tileLayer(TILE_URL, {
    attribution: TILE_ATTRIBUTION,
    maxZoom: 19,
  }).addTo(map);
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Teardrop pin with the category emoji. */
export function postIcon(emoji: string, color: string, selected = false) {
  const size = selected ? 46 : 38;
  return L.divIcon({
    className: "ibb-marker",
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 6],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:${escape(color)};box-shadow:0 4px 10px rgba(0,0,0,.25);border:3px solid #fff;display:grid;place-items:center;transition:all .15s">
      <span style="transform:rotate(45deg);font-size:${selected ? 21 : 17}px;line-height:1">${escape(emoji)}</span></div>`,
  });
}

/** Round bubble showing how many posts are in this area. */
export function clusterIcon(count: number) {
  const size = count < 10 ? 38 : count < 100 ? 46 : count < 1000 ? 54 : 62;
  const label = count < 1000 ? String(count) : `${Math.round(count / 100) / 10}k`;
  return L.divIcon({
    className: "ibb-cluster",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:rgba(5,150,105,.22);display:grid;place-items:center">
      <div style="width:${size - 10}px;height:${size - 10}px;border-radius:9999px;background:#059669;color:#fff;font-weight:800;font-size:13px;display:grid;place-items:center;box-shadow:0 2px 8px rgba(5,150,105,.45);border:2px solid #fff">${label}</div></div>`,
  });
}

/** Pulsing "you are here" dot. */
export function meIcon() {
  return L.divIcon({
    className: "ibb-pin",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<div style="position:relative;width:22px;height:22px">
      <span style="position:absolute;inset:0;border-radius:9999px;background:rgba(37,99,235,.35);animation:ping 1.6s cubic-bezier(0,0,.2,1) infinite"></span>
      <span style="position:absolute;inset:4px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)"></span></div>`,
  });
}
