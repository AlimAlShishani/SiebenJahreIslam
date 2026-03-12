-- 45: FCM-Token für native Apps (Capacitor)
-- Ermöglicht Push-Benachrichtigungen über Firebase Cloud Messaging auf Android/iOS.

alter table public.push_subscriptions add column if not exists fcm_token text unique;

comment on column public.push_subscriptions.fcm_token is 'FCM-Token für native Apps (Capacitor). Bei Web-Push null.';

create index if not exists idx_push_subscriptions_fcm_token on public.push_subscriptions(fcm_token) where fcm_token is not null;
