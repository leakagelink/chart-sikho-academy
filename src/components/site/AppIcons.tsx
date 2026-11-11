import type { SVGProps } from "react";

/**
 * ChartSikho app icon set: rounded duotone glyphs (a soft tinted fill under a crisp outline).
 * They inherit `currentColor`, so active/inactive colours come from the surrounding text colour.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}
const tint = { fill: "currentColor", fillOpacity: 0.22, stroke: "none" } as const;

export const AppHome = (p: IconProps) => <Svg {...p}><path {...tint} d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" /><path d="M3 11 12 3.8 21 11" /><path d="M5 9.6V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V9.6" /><path d="M9.5 20.5v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5" /></Svg>;
export const AppCourses = (p: IconProps) => <Svg {...p}><path {...tint} d="M12 4.5 2.5 9 12 13.5 21.5 9z" /><path d="M12 4.5 2.5 9 12 13.5 21.5 9z" /><path d="M6.5 11v4.6c0 1.6 2.5 3.4 5.5 3.4s5.5-1.8 5.5-3.4V11" /><path d="M21.5 9v5.5" /></Svg>;
export const AppLive = (p: IconProps) => <Svg {...p}><rect {...tint} x="3" y="5.5" width="18" height="12" rx="3" /><rect x="3" y="5.5" width="18" height="12" rx="3" /><path d="M10.2 9.2v4.6l4-2.3z" fill="currentColor" /><path d="M8 21h8" /><path d="M12 17.5V21" /></Svg>;
export const AppEbook = (p: IconProps) => <Svg {...p}><path {...tint} d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z" /><path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5" /><path d="M12 6.5c2-1.5 5-2 8.5-1.5v13c-3.5-.5-6.5 0-8.5 1.5z" /><path d="M12 6.5v13" /></Svg>;
export const AppProfile = (p: IconProps) => <Svg {...p}><circle {...tint} cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M6.6 18.2c1.2-1.9 3.1-2.9 5.4-2.9s4.2 1 5.4 2.9" /></Svg>;
export const AppWebinar = (p: IconProps) => <Svg {...p}><rect {...tint} x="2.5" y="4" width="19" height="13" rx="2.5" /><rect x="2.5" y="4" width="19" height="13" rx="2.5" /><circle cx="12" cy="9" r="2" /><path d="M8.5 14c.7-1.3 2-2 3.5-2s2.8.7 3.5 2" /><path d="M8 20.5h8" /></Svg>;
export const AppSeminar = (p: IconProps) => <Svg {...p}><circle {...tint} cx="12" cy="8" r="3.2" /><circle cx="12" cy="8" r="3.2" /><path d="M6 19.5c.6-3 3-5 6-5s5.4 2 6 5" /><circle cx="5" cy="10" r="2" /><circle cx="19" cy="10" r="2" /><path d="M2 17c.3-1.6 1.4-2.7 3-3" /><path d="M22 17c-.3-1.6-1.4-2.7-3-3" /></Svg>;
export const AppCertificate = (p: IconProps) => <Svg {...p}><circle {...tint} cx="12" cy="9" r="6" /><circle cx="12" cy="9" r="6" /><path d="m9.5 9 1.7 1.7 3.3-3.4" /><path d="m8.3 13.7-1.3 7 5-2.7 5 2.7-1.3-7" /></Svg>;
export const AppWallet = (p: IconProps) => <Svg {...p}><rect {...tint} x="3" y="6" width="18" height="14" rx="3" /><path d="M16.5 6V4.8a1.5 1.5 0 0 0-1.9-1.4L5 6" /><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M21 11h-4a2 2 0 0 0 0 4h4" /><circle cx="17" cy="13" r=".6" fill="currentColor" /></Svg>;
export const AppTeam = (p: IconProps) => <Svg {...p}><circle {...tint} cx="9" cy="8" r="3.5" /><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.4 3.1-5.5 6.5-5.5s5.9 2.1 6.5 5.5" /><path d="M16 4.7a3.5 3.5 0 0 1 0 6.6" /><path d="M18.5 14.8c1.7.8 2.7 2.6 3 5.2" /></Svg>;
export const AppTree = (p: IconProps) => <Svg {...p}><rect {...tint} x="9" y="2.5" width="6" height="5" rx="1.5" /><rect x="9" y="2.5" width="6" height="5" rx="1.5" /><rect x="2.5" y="16.5" width="6" height="5" rx="1.5" /><rect x="15.5" y="16.5" width="6" height="5" rx="1.5" /><path d="M12 7.5V12M5.5 16.5V12h13v4.5" /></Svg>;
export const AppSupport = (p: IconProps) => <Svg {...p}><path {...tint} d="M4 12a8 8 0 1 1 3.3 6.5L3.5 20l1.3-3.6A7.9 7.9 0 0 1 4 12z" /><path d="M4 12a8 8 0 1 1 3.3 6.5L3.5 20l1.3-3.6A7.9 7.9 0 0 1 4 12z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth={2.6} /></Svg>;
export const AppKyc = (p: IconProps) => <Svg {...p}><path {...tint} d="M12 2.8 19.5 6v5.3c0 4.5-3.1 8.4-7.5 9.9-4.4-1.5-7.5-5.4-7.5-9.9V6z" /><path d="M12 2.8 19.5 6v5.3c0 4.5-3.1 8.4-7.5 9.9-4.4-1.5-7.5-5.4-7.5-9.9V6z" /><path d="m8.8 12 2.2 2.2 4.2-4.4" /></Svg>;
export const AppBell = (p: IconProps) => <Svg {...p}><path {...tint} d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 21a2.2 2.2 0 0 0 4 0" /></Svg>;
export const AppChart = (p: IconProps) => <Svg {...p}><rect {...tint} x="3" y="3" width="18" height="18" rx="4" /><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M7 16.5v-3M11 16.5V9.5M15 16.5v-5M7.5 9.5l3.5-2.5 3 2 3-3" /></Svg>;
export const AppCrown = (p: IconProps) => <Svg {...p}><path {...tint} d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 10H5z" /><path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 10H5z" /><path d="M5.5 21h13" /></Svg>;
export const AppRupee = (p: IconProps) => <Svg {...p}><circle {...tint} cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="9" /><path d="M8.5 7.5h7M8.5 10.5h7M10.5 7.5c3 0 3 6 0 6H8.5l5 4" /></Svg>;
export const AppSettings = (p: IconProps) => <Svg {...p}><circle {...tint} cx="12" cy="12" r="8" /><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.8" /></Svg>;
export const AppLogout = (p: IconProps) => <Svg {...p}><path {...tint} d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 1-2-2z" /><path d="M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" /><path d="M16 8l4 4-4 4M20 12H9.5" /></Svg>;
export const AppEdit = (p: IconProps) => <Svg {...p}><path {...tint} d="M4 20v-3.5L15.5 5a2.1 2.1 0 0 1 3 3L7 19.5z" /><path d="M4 20v-3.5L15.5 5a2.1 2.1 0 0 1 3 3L7 19.5z" /><path d="M13.5 7 17 10.5" /></Svg>;
