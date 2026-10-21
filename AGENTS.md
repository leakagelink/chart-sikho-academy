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
- Shared page motion uses browser-only intersection observation for one-shot content entrances and CSS for interactions, respecting reduced-motion settings; why: all pages animate without changing data flows or blocking content access.
- The branded splash wraps the shared app shell and dismisses locally on each full app load, with reduced-motion support; why: every entry page gets the same launch experience without replaying on internal navigation or changing account data.
- All UI copy goes through `src/lib/i18n.tsx` (`t(key)` with en/hi values); why: every screen must switch between Hindi and English.
- Sample course/live-class data lives in `src/lib/courses.ts` until a real backend replaces it; why: one place to swap in real data.
- Auth: student accounts via Lovable Cloud; signed-in pages live under `src/routes/_authenticated/` (client-only gate redirects to /auth); why: one guard for every portal page.
- Paid-course enrollment is blocked by database policy until payments are verified server-side; only free courses can be self-enrolled; why: browser can never grant itself paid access.
- Client-test features live under `/sandbox` with browser-local state isolated from Cloud accounts, enrollments and permissions; why: clients can exercise student and admin mocks without receiving real access or moving money.
