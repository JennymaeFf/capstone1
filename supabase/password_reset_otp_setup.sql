alter table public.otp_verifications
drop constraint if exists otp_verifications_purpose_check;

alter table public.otp_verifications
add constraint otp_verifications_purpose_check
check (purpose in ('registration', 'login', 'password-reset'));
