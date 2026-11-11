import { useEffect, useState } from "react";

/** User-agent marker appended by the Android/iOS app (capacitor.config.ts appendUserAgent). */
export const NATIVE_APP_UA_MARKER = "ChartSikhoApp";

type NativeWindowLike = {
  Capacitor?: { isNativePlatform?: () => boolean };
  navigator?: { userAgent?: string };
};

/** True only inside the installed Capacitor phone app, never in a normal browser. */
export function isNativeAppEnv(win: NativeWindowLike | undefined): boolean {
  if (!win) return false;
  try {
    if (win.Capacitor?.isNativePlatform?.() === true) return true;
  } catch {
    // Bridge not ready; fall back to the user-agent marker.
  }
  return (win.navigator?.userAgent ?? "").includes(NATIVE_APP_UA_MARKER);
}

/** Client-only check (false during SSR and first render, so hydration stays consistent). */
export function useIsNativeApp(): boolean {
  const [native, setNative] = useState(false);
  useEffect(() => {
    setNative(isNativeAppEnv(window as unknown as NativeWindowLike));
  }, []);
  return native;
}

/** Phone-size screens (below the desktop breakpoint) — matches the bottom-bar navigation breakpoint. */
export const PHONE_LAYOUT_QUERY = "(max-width: 1023px)";

/** True in the installed app or on any phone/tablet-size screen; false on desktop and during SSR. */
export function useIsPhoneLayout(): boolean {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(PHONE_LAYOUT_QUERY);
    const update = () => setPhone(isNativeAppEnv(window as unknown as NativeWindowLike) || mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return phone;
}
