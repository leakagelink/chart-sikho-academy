import { useState } from "react";
import { Hand, LogOut, Mic, MicOff, Send, Users, Video, VideoOff, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { liveClassCombo } from "@/lib/courses";

type Session = keyof typeof liveClassCombo;

export function LiveClassCombo() {
  const { t } = useLang();
  const [session, setSession] = useState<Session>("broadcast");
  const [joined, setJoined] = useState(false);
  const [mic, setMic] = useState(false);
  const [camera, setCamera] = useState(false);
  const [hand, setHand] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Record<Session, string[]>>({ broadcast: [], doubts: [] });

  function leave() {
    setJoined(false);
    setMic(false);
    setCamera(false);
    setHand(false);
  }

  return (
    <section className="mt-6 min-w-0" aria-label={t("live_sample")} data-session-mode={liveClassCombo[session].mode}>
      <div className="grid max-w-lg grid-cols-2 gap-2" role="group" aria-label={t("live_sample")}>
        <Button className="h-auto min-h-10 whitespace-normal py-2" variant={session === "broadcast" ? "default" : "outline"} aria-pressed={session === "broadcast"} onClick={() => { setSession("broadcast"); setMessage(""); }}><Youtube />{t("broadcast_class")}</Button>
        <Button className="h-auto min-h-10 whitespace-normal py-2" variant={session === "doubts" ? "default" : "outline"} aria-pressed={session === "doubts"} onClick={() => { setSession("doubts"); setMessage(""); }}><Video />{t("doubt_session")}</Button>
      </div>
      <p className="my-3 text-xs font-medium text-gold">{t("combo_preview")}</p>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          {session === "broadcast" ? (
            <>
              <video controls playsInline preload="metadata" className="aspect-video w-full rounded-lg bg-navy" aria-label={t("sample_video")}>
                <source src="/media/chart-sample.webm" type="video/webm" />
                <source src="/media/chart-sample.mp4" type="video/mp4" />
              </video>
              <p className="mt-2 text-sm text-muted-foreground">{t("sample_video")}</p>
              <Button variant="outline" className="mt-3 h-auto min-h-9 whitespace-normal py-2" onClick={() => setSession("doubts")}><Video />{t("join_doubts")}</Button>
            </>
          ) : (
            <>
              <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-lg border border-border bg-navy p-5 text-center text-navy-foreground sm:aspect-video">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-royal/20 text-primary"><Users className="h-8 w-8" /></span>
                <p className="font-display text-lg font-semibold" role="status">{t(joined ? "session_joined" : "session_waiting")}</p>
                {joined ? <span className="text-sm text-muted-foreground">{t("you")}</span> : <Button className="h-auto min-h-9 whitespace-normal py-2" onClick={() => setJoined(true)}><Video />{t("join_doubts")}</Button>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="icon" variant={mic ? "default" : "outline"} disabled={!joined} aria-label={t(mic ? "mic_on" : "mic_off")} title={t(mic ? "mic_on" : "mic_off")} aria-pressed={mic} onClick={() => setMic(!mic)}>{mic ? <Mic /> : <MicOff />}</Button>
                <Button size="icon" variant={camera ? "default" : "outline"} disabled={!joined} aria-label={t(camera ? "camera_on" : "camera_off")} title={t(camera ? "camera_on" : "camera_off")} aria-pressed={camera} onClick={() => setCamera(!camera)}>{camera ? <Video /> : <VideoOff />}</Button>
                <Button size="icon" variant={hand ? "default" : "outline"} disabled={!joined} aria-label={t(hand ? "hand_raised" : "raise_hand")} title={t(hand ? "hand_raised" : "raise_hand")} aria-pressed={hand} onClick={() => setHand(!hand)}><Hand /></Button>
                {joined && <Button variant="destructive" onClick={leave}><LogOut />{t("leave_session")}</Button>}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{t("no_device_capture")}</p>
            </>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold">{t("chat")}</h2>
          <p className="mt-2 text-xs text-muted-foreground">{t("chat_sample")}</p>
          <div className="my-4 h-48 space-y-2 overflow-y-auto border-y border-border py-3" role="log" aria-label={t("chat")} aria-live="polite">
            {messages[session].map((m, i) => <p key={i} className="break-words rounded-md bg-muted p-3 text-sm">{m}</p>)}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!message.trim() || (session === "doubts" && !joined)) return; setMessages((s) => ({ ...s, [session]: [...s[session], message.trim()] })); setMessage(""); }}>
            <input required maxLength={500} disabled={session === "doubts" && !joined} value={message} onChange={(e) => setMessage(e.target.value)} aria-label={t("chat")} className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 disabled:opacity-50" />
            <Button type="submit" size="icon" disabled={session === "doubts" && !joined} aria-label={t("send")} title={t("send")}><Send /></Button>
          </form>
        </div>
      </div>
    </section>
  );
}