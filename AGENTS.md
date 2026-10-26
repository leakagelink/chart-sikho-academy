<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules
- Capacitor builds launch the public published URL (never the private preview, which demands a Lovable login) and allow in-WebView navigation only to that host; why: users open the app without Lovable access and nothing redirects to the external browser.
- Wallet/referral and support entry points live in the shared floating actions, outside page motion; why: they stay fixed across pages without animation transforms, while mock screens retain their isolated data.
- Shared page motion observes only newly added content for one-shot intersection entrances, excludes video surfaces, and uses CSS interactions with reduced-motion support; why: animations avoid repeated full-page scans and video-control interference.
- Shared navigation switches to a bottom bar below the desktop breakpoint, with grid-based mobile headers and safe-area spacing; why: bilingual navigation remains accessible without header crowding across screen sizes.
- The branded splash wraps the shared app shell and dismisses locally on each full app load, with reduced-motion support; why: every entry page gets the same launch experience without replaying on internal navigation or changing account data.
- All UI copy goes through `src/lib/i18n.tsx` (`t(key)` with en/hi values); why: every screen must switch between Hindi and English.
- Sample course/live-class data lives in `src/lib/courses.ts` until a real backend replaces it; why: one place to swap in real data.
- Auth: student accounts via Lovable Cloud; signed-in pages live under `src/routes/_authenticated/` (client-only gate redirects to /auth); why: one guard for every portal page.
- Paid-course enrollment is blocked by database policy until payments are verified server-side; only free courses can be self-enrolled; why: browser can never grant itself paid access.
- Client-test features live under `/sandbox` with browser-local state isolated from Cloud accounts, enrollments and permissions; why: clients can exercise student and admin mocks without receiving real access or moving money.

- The app uses a dark navy + gold premium theme (gold is `primary`, royal blue is `royal`) per the client blueprint; keep semantic tokens, never reintroduce a light default.
