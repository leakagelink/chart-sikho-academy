# Roadmap

## Open
- [ ] Live payments, money transfers, email/WhatsApp/SMS delivery — need separate approval and provider accounts
- [ ] Activate real YouTube + Jitsi sessions — awaiting client testing approval, actual YouTube stream, and confirmed Jitsi hosting/cost; public meet.jit.si embeds are demo-limited
- [ ] Verify rebuilt Android APK stays in-app on user's device (explicit project-host navigation configured and tests passed; Android project/device and actual redirect destination unavailable here; preview returns 401 without access)
- [ ] Full signed-in data-change test of My Learning + Profile (signed-in screens verified; progress mutation/profile save verification still pending)
- [ ] Real course data from user (prices, ratings, class times, stats)
- [ ] Payment gateway (LIVE) — only after client approves test app; do NOT add now

## Done
- [x] Student blueprint visual correction: white content scoped to student screens, navy/gold branding, gold action gradients, compact course/order/live lists, lesson rows, horizontal referral tree and white Profile menu. Phone/desktop screens and signed-in Profile checked; original logo retained, generated sample cover/backdrop used, social login remains hidden by testing constraint. Not a pixel-identical replica of the low-resolution reference.
- [x] Designated Admin and Student Cloud login accounts provisioned; real password login reaches /admin and /dashboard respectively, and Student is denied Admin access; existing security tests passed
- [x] Secure Cloud admin panel at /admin with 16 sections, CSV export, role-protected saves, uploads, in-app notifications and audit history; course + notification save verified end-to-end
- [x] YouTube class + Jitsi doubt-session combo previews on public class and Test Portal pages; sample video playback, separate discussions, join/leave, simulated mic/camera/hand controls verified in Hindi/English; 6 rule tests passed; no external connection or device capture
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
- [x] Blueprint screen-by-screen match: home greeting (Hello + name, time-based wish, bell) + 68% continue-learning card with gold Start Learning; course list Basics/Technical/Options tabs; course detail gold-icon feature list (modules/videos/doubt/notes/examples/lifetime); video player Notes/Downloads/Q&A tabs + lesson durations; live classes Upcoming/Past tabs with Join Live/Register; new My Orders mock (All/Courses/Webinars/eBooks tabs, Paid badges, View Details); referrals screen with code card + Copy, 3 stats, team tree levels + View Full Team; profile menu list (Edit Profile, My Courses, Certificates, Referral, Earnings, Payouts, Notifications, Support, Settings, red Logout); Playwright-verified mobile + desktop, no page errors, tests+build OK
