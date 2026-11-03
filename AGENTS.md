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
- Completed live-class recordings sync atomically to one source-linked course lesson via a role-checked database trigger; why: repeated saves update the same video without duplicate curriculum, and no external recording automation is implied.
- Video Library deletion clears lesson video sources through the role-checked admin operation, retaining lesson/PDF records and stored files; why: removing a video must not erase accompanying notes or shared media.
- Course deletion uses an atomic role-checked database function and preserves linked student/commerce records; why: removing curriculum must not partially delete a course or erase purchase history.
- Optional lesson PDFs reuse the private course-resources object path and enrollment-scoped access; why: video-plus-PDF and video-only lessons need no duplicate attachment schema.
- Administration lives under the authenticated /admin subtree with per-user section/action permissions enforced by server functions and database RLS; only full admins assign roles/permissions. Why: delegated users cannot elevate access or read unrelated administration datasets; payment settlement and external messaging remain separately disabled.
- Admin resources use validated database operations with an audit trail; finance records are read-only except review/rejection, preventing manual payment verification or paid enrollment grants.
- Capacitor builds launch the primary public domain and allow in-WebView navigation to it plus the lovable.app host that redirects to it (never the private preview); why: a redirect to an unlisted host opens the external browser.
- Wallet/referral and support entry points live in the shared floating actions, outside page motion; why: they stay fixed across pages without animation transforms, while mock screens retain their isolated data.
- Shared page motion observes only newly added content for one-shot intersection entrances, excludes video surfaces, and uses CSS interactions with reduced-motion support; why: animations avoid repeated full-page scans and video-control interference.
- Shared navigation switches to a bottom bar below the desktop breakpoint, with grid-based mobile headers and safe-area spacing; why: bilingual navigation remains accessible without header crowding across screen sizes.
- The branded splash wraps the shared app shell and dismisses locally on each full app load, with reduced-motion support; why: every entry page gets the same launch experience without replaying on internal navigation or changing account data.
- All UI copy goes through `src/lib/i18n.tsx` (`t(key)` with en/hi values); why: every screen must switch between Hindi and English.
- Sample course/live-class data lives in `src/lib/courses.ts` until a real backend replaces it; why: one place to swap in real data.
- Auth: student accounts via Lovable Cloud; signed-in pages live under `src/routes/_authenticated/` (client-only gate redirects to /auth); why: one guard for every portal page.
- Paid-course enrollment is blocked by database policy until payments are verified server-side; only free courses can be self-enrolled; why: browser can never grant itself paid access.
- Client-test features live under `/sandbox` with browser-local state isolated from Cloud accounts, enrollments and permissions; why: clients can exercise student and admin mocks without receiving real access or moving money.
- Live-class pages share LiveClassCombo with provider configuration in the sample catalog; previews never load third-party scripts, capture devices, or connect to meetings, so testing cannot accidentally create a live session.

- Student content surfaces use scoped semantic tokens in PageMotion; branded chrome/auth/splash and admin retain navy/gold tokens. Why: the reference mixes white student content with dark branding without changing admin or authentication behavior.
- Course final quizzes link through the course record (one quiz may serve many courses); students get questions, scoring, attempt limits and automatic certificates only through security-definer database functions gated on full lesson completion; why: answer keys stay hidden and the browser cannot forge scores or certificates.
- Referral commissions are generated, reversed and released only by database triggers/security-definer functions from verified paid orders and admin settings; the browser can only request payouts through a checked function. Why: amounts, limits, KYC and holding rules cannot be bypassed.
- Admin notifications flagged show_popup appear once as a homepage/dashboard popup and stay in the inbox; sent push Campaigns create one in-app notification via a role-checked trigger. Why: one delivery path for inbox and popup without duplicates.
