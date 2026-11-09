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
- Admin and checkout QR share payment-upi helpers; an uploaded QR (private bucket) overrides the generated one. Why: students see the saved destination.
- Home/catalog purchasing uses published Cloud courses, never sample IDs; category/banner/plan visibility stays public and admin CRUD stays scoped. Why: purchases require real products; plans grant no undefined access.
- Wallet reads explicitly scope every financial query to the caller; withdrawal destinations are owner-private preferences snapshotted immutably on request. Why: later bank/UPI edits cannot reroute pending withdrawals; deposits and bonuses never inflate commission balance.
- Profile saves allow only personal fields; photos and KYC documents use private owner storage. KYC requests/reviews use atomic permission-checked RPCs, a separate protected status and targeted inbox notifications. Why: students cannot approve identities or expose documents.
- Public branding loads in the root loader before SSR and seeds the shared branding query; all logo surfaces and favicon consume that value, with no default fallback while unresolved. Why: initial open/refresh must not flash a previous logo or expose private settings.
- Completed live-class recordings sync atomically to one source-linked course lesson via a role-checked database trigger; why: repeated saves update the same video without duplicate curriculum, and no external recording automation is implied.
- Video Library deletion clears lesson video sources through the role-checked admin operation, retaining lesson/PDF records and stored files; why: removing a video must not erase accompanying notes or shared media.
- Course deletion uses an atomic role-checked database function and preserves linked student/commerce records; why: removing curriculum must not partially delete a course or erase purchase history.
- Courses reuse the permission-checked Builder for videos, draft-first saves and publish checks; optional PDFs use private course-resources. Why: one curriculum flow retains enrollment access.
- Administration uses a shared searchable desktop rail/mobile drawer under authenticated /admin, preserving per-section/action server and RLS checks; only full admins assign access. Why: responsive navigation cannot elevate privileges; settlement and external messaging remain disabled.
- Admin operations are validated/audited; confirmed member batches reuse permission-checked single-record actions and report failures. Finance stays read-only except review/rejection; only role-checked manual UPI approval creates paid orders/enrollments. Why: browsers cannot grant payment or bypass permissions.
- Capacitor builds launch the primary public domain and allow in-WebView navigation to it plus the lovable.app host that redirects to it (never the private preview); why: a redirect to an unlisted host opens the external browser.
- Student affiliates use own-only paginated queries; admin tree uses cycle-safe all-depth levels and permission-gated signed photos. Why: student direct-team access cannot expose deeper members; admin trees show real relationships.
- Shared page motion observes only newly added content for one-shot intersection entrances, excludes video surfaces, and uses CSS interactions with reduced-motion support; why: animations avoid repeated full-page scans and video-control interference.
- Shared navigation switches to a bottom bar below the desktop breakpoint, with grid-based mobile headers and safe-area spacing; why: bilingual navigation remains accessible without header crowding across screen sizes.
- The branded splash wraps the shared app shell and dismisses locally on each full app load, with reduced-motion support; why: every entry page gets the same launch experience without replaying on internal navigation or changing account data.
- All UI copy goes through `src/lib/i18n.tsx` (`t(key)` with en/hi values); why: every screen must switch between Hindi and English.
- Student catalog, learning stats, classes and certificates use Cloud records or empty states. Why: no fictional products or progress.
- Auth: student accounts via Lovable Cloud; signed-in pages live under `src/routes/_authenticated/` (client-only gate redirects to /auth); why: one guard for every portal page.
- Paid-course enrollment is blocked by database policy until payments are verified server-side; only free courses can be self-enrolled; why: browser can never grant itself paid access.
- Demo/Test Portal routes and browser-local mock data are removed. Why: the app must show only actual records.
- Session catalogs use safe metadata RPCs; paid session links require own verified orders via my_session_access and manual UPI approval; no automatic external connections. Why: public listings must not leak paid meeting links.
- Student session lists share pure timing/price/search filtering over safe catalog metadata; drafts remain unpublished regardless of price. Why: upcoming paid sessions must be discoverable without exposing unfinished sessions or meeting links.

- Student content surfaces use scoped semantic tokens in PageMotion; branded chrome/auth/splash and admin retain navy/gold tokens. Why: the reference mixes white student content with dark branding without changing admin or authentication behavior.
- Course final quizzes link through the course record (one quiz may serve many courses); students get questions, scoring, attempt limits and automatic certificates only through security-definer database functions gated on full lesson completion; why: answer keys stay hidden and the browser cannot forge scores or certificates.
- Auth signup trigger assigns validated referral/default Admin and own code, never sample enrollment or earnings; paid-order triggers retain parents. Why: metadata changes cannot reparent users or forge commissions.
- Admin notifications flagged show_popup appear once as a homepage/dashboard popup and stay in the inbox; sent push Campaigns create one in-app notification via a role-checked trigger. Why: one delivery path for inbox and popup without duplicates.
- Public loaders rewrite inline data-URL images via siteImage() to /api/public/site-image; why: embedded images bloated HTML.
