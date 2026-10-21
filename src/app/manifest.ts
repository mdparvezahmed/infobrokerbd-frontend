import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "InfoBrokerBD — find the best in Bangladesh",
    short_name: "InfoBrokerBD",
    description: "Real experiences from real people: the best shops, services and places in Bangladesh.",
    lang: "en-BD",
    categories: ["travel", "lifestyle", "shopping", "navigation"],
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7f4",
    theme_color: "#059669",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
