# Roadmap

## Open
- [ ] Verify rebuilt Android APK stays in-app on user's device (explicit project-host navigation configured and tests passed; Android project/device and actual redirect destination unavailable here; preview returns 401 without access)
- [ ] Full signed-in data-change test of My Learning + Profile (signed-in screens verified; progress mutation/profile save verification still pending)
- [ ] Real course data from user (prices, ratings, class times, stats)
- [ ] Payment gateway (LIVE) — only after client approves test app; do NOT add now

## Done
- Wallet toggle at left-center with wallet/referral links, referrals inside wallet, and floating support above mobile navigation; removed these shortcuts from Test Portal navigation and overview
- All-screen responsive enhancement: 320/393/834/1280 widths checked in Hindi/English; signed-in dashboard/profile render, tablet navigation and phone forms improved; animation observer optimized; existing tests passed
- Mock test portal: playable sample video, 3 lessons, saved notes, quiz/retry and sample certificate download; verified end-to-end
- Local-only referrals/wallet: no sign-up commission, test withdrawal and admin approval; no real money or account mutations
- Mock admin overview, course visibility/add, student status, booking confirmation, sales/payout screens; live discussion and support previews
- Public Test Portal entry, Hindi/English on new screens, desktop/mobile checks, rule tests and routing tests passed
- Demo-class booking form (saves to database) ✔
- Live class pages with reminder toggle ✔
- Membership plans page (test mode, no payments) ✔
- Notifications bell panel (sample data) ✔
- Course detail pages; free course enrolls, paid shows "payments coming soon" ✔
- Google / Lovable social sign-in hidden on login & sign-up (re-enable at go-live) ✔

## Done
- [x] Dark navy + gold premium UI/UX matching client blueprint image: dark theme tokens (gold primary), 6-tile category grid (My Courses/Live/Webinars/eBooks/Tests/Certificates), course detail Overview/Curriculum/Reviews tabs, gold prices + buttons, dark splash, royal-blue thumbnails; verified desktop/mobile/Hindi, no overflow, tests+build OK
