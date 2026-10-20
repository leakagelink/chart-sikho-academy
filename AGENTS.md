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
- All UI copy goes through `src/lib/i18n.tsx` (`t(key)` with en/hi values); why: every screen must switch between Hindi and English.
- Sample course/live-class data lives in `src/lib/courses.ts` until a real backend replaces it; why: one place to swap in real data.
