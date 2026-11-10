-- Read-only checks against the same eligibility function enforced by the payout trigger.
SELECT
 NOT public.purchase_withdrawal_eligible(0,3999) AS signup_without_purchase_blocked,
 NOT public.purchase_withdrawal_eligible(3998,3999) AS below_minimum_blocked,
 public.purchase_withdrawal_eligible(3999,3999) AS exact_minimum_allowed,
 public.purchase_withdrawal_eligible(4000,3999) AS above_minimum_allowed,
 public.purchase_withdrawal_eligible(1999+2000,3999) AS multiple_courses_combined,
 NOT public.purchase_withdrawal_eligible(3999,5000) AS changed_minimum_enforced;