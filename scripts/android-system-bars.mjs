// Runs automatically after `npx cap sync` (package.json "capacitor:sync:after").
// Colours the Android window behind the status bar and the bottom navigation bar
// with the brand navy, so those strips never show white on any phone/WebView version.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const NAVY = "#0B2460";
const values = join(process.cwd(), "android", "app", "src", "main", "res", "values");
const stylesPath = join(values, "styles.xml");

if (!existsSync(stylesPath)) {
  console.log("[system-bars] Android project not found, skipping.");
  process.exit(0);
}

writeFileSync(
  join(values, "chartsikho_colors.xml"),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="chartsikho_navy">${NAVY}</color>\n</resources>\n`,
);

const items = [
  ["android:windowBackground", "@color/chartsikho_navy"],
  ["android:statusBarColor", "@color/chartsikho_navy"],
  ["android:navigationBarColor", "@color/chartsikho_navy"],
];

let xml = readFileSync(stylesPath, "utf8");
// Patch every app theme except the launch (splash) theme.
xml = xml.replace(/(<style\s+name="(AppTheme(?:\.NoActionBar)?)"[^>]*>)([\s\S]*?)(<\/style>)/g, (_m, open, _name, body, close) => {
  let next = body;
  for (const [name, value] of items) {
    const re = new RegExp(`\\s*<item name="${name}">[^<]*</item>`);
    next = next.replace(re, "");
    next = next.replace(/\s*$/, "") + `\n        <item name="${name}">${value}</item>`;
  }
  return `${open}${next}\n    ${close}`;
});
writeFileSync(stylesPath, xml);
console.log("[system-bars] Android status/navigation bars set to brand navy.");
