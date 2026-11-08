-- Read-only regression checks for the database eligibility rule.
SELECT
  public.direct_buyer_purchase_eligible('paid', 'UPI:verified', 1999) AS verified_purchase,
  NOT public.direct_buyer_purchase_eligible('pending', 'UPI:verified', 1999) AS pending_excluded,
  NOT public.direct_buyer_purchase_eligible('failed', 'UPI:verified', 1999) AS failed_excluded,
  NOT public.direct_buyer_purchase_eligible('paid', NULL, 1999) AS unverified_excluded,
  NOT public.direct_buyer_purchase_eligible('paid', '', 1999) AS empty_proof_excluded,
  NOT public.direct_buyer_purchase_eligible('paid', 'UPI:verified', 0) AS free_excluded;