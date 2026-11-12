import { useEffect, useState } from "react";
import { Download, Upload, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { isNativeAppEnv } from "@/lib/native-app";

const BUCKET = "app-downloads";
const FILE = "chartsikho.apk";

async function apkLink(): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(FILE, 3600, { download: "ChartSikho.apk" });
  return data?.signedUrl ?? null;
}

/** Strip under the header; hidden inside the native app and when no APK is uploaded. */
export function AppDownloadBar() {
  const { lang } = useLang();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { if (!isNativeAppEnv()) apkLink().then(setUrl); }, []);
  if (!url) return null;
  return (
    <div className="flex items-center justify-center gap-3 border-b border-border bg-navy px-3 py-1.5 text-sm text-navy-foreground">
      <Smartphone size={16} className="shrink-0 text-gold" />
      <span className="truncate">{lang === "hi" ? "Chartसीखो मोबाइल ऐप पाएँ" : "Get the Chartसीखो mobile app"}</span>
      <Button asChild size="sm" className="h-7 shrink-0 bg-gold px-3 text-navy hover:bg-gold/90">
        <a href={url}><Download size={14} />{lang === "hi" ? "ऐप डाउनलोड" : "Download App"}</a>
      </Button>
    </div>
  );
}

export function AdminApkSettings() {
  const { lang } = useLang();
  const hi = lang === "hi";
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const load = async () => {
    const { data } = await supabase.storage.from(BUCKET).list("", { search: FILE });
    const f = data?.find((x) => x.name === FILE);
    setInfo(f ? `${((f.metadata?.size ?? 0) / 1048576).toFixed(1)} MB · ${new Date(f.updated_at ?? f.created_at ?? "").toLocaleString()}` : null);
  };
  useEffect(() => { load(); }, []);
  async function upload(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".apk")) { setMsg(hi ? "केवल .apk फ़ाइल चुनें" : "Please choose an .apk file"); return; }
    setBusy(true); setMsg("");
    const { error } = await supabase.storage.from(BUCKET).upload(FILE, file, { upsert: true, contentType: "application/vnd.android.package-archive" });
    setBusy(false);
    setMsg(error ? (hi ? "अपलोड विफल: " : "Upload failed: ") + error.message : hi ? "APK अपलोड हो गया" : "APK uploaded");
    load();
  }
  async function remove() {
    setBusy(true);
    await supabase.storage.from(BUCKET).remove([FILE]);
    setBusy(false); setMsg(hi ? "APK हटाया गया" : "APK removed"); load();
  }
  return (
    <div className="mb-5 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">{hi ? "मोबाइल ऐप (APK)" : "Mobile app (APK)"}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hi ? "अपलोड की गई APK वेबसाइट हेडर के नीचे 'Download App' बटन से मिलेगी।" : "The uploaded APK is offered via the 'Download App' button below the website header."}</p>
      <p className="mt-2 text-xs">{info ?? (hi ? "अभी कोई APK नहीं" : "No APK uploaded yet")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground ${busy ? "opacity-60" : ""}`}>
          <Upload size={16} />{busy ? (hi ? "अपलोड हो रहा है…" : "Uploading…") : hi ? "APK अपलोड करें" : "Upload APK"}
          <input type="file" accept=".apk,application/vnd.android.package-archive" className="hidden" disabled={busy} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {info && <Button variant="outline" size="sm" disabled={busy} onClick={remove}>{hi ? "हटाएँ" : "Remove"}</Button>}
      </div>
      {msg && <p className="mt-2 text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}
