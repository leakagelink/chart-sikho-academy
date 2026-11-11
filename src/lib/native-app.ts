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
