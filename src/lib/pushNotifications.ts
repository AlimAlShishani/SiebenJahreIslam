import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
};

/** Web Push: Service Worker + VAPID */
async function ensureWebPushSubscription(userId: string): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') return;
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return;
  if (!VAPID_PUBLIC_KEY) {
    console.warn('Missing VITE_VAPID_PUBLIC_KEY: push subscription skipped.');
    return;
  }
  const registration = await navigator.serviceWorker.register('/push-sw.js');
  const ready = await navigator.serviceWorker.ready;
  if (!ready.active && !registration.active) return;
  let subscription = await ready.pushManager.getSubscription();
  if (!subscription) {
    subscription = await ready.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  const json = subscription.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!endpoint || !p256dh || !auth) return;
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint,
      p256dh,
      auth,
      user_agent: navigator.userAgent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  );
  if (error) console.error('Error saving push subscription:', error);
}

/** Native (Capacitor): FCM Token */
async function ensureFcmSubscription(userId: string): Promise<void> {
  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return;
    const { token } = await PushNotifications.register();
    if (!token) return;
    const fcmEndpoint = `fcm:${userId}`;
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: fcmEndpoint,
        p256dh: '',
        auth: '',
        fcm_token: token,
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );
    if (error) console.error('Error saving FCM subscription:', error);
  } catch (e) {
    console.error('FCM registration failed:', e);
  }
}

export const ensurePushSubscription = async (userId: string) => {
  if (typeof window === 'undefined') return;
  if (Capacitor.isNativePlatform()) {
    await ensureFcmSubscription(userId);
  } else {
    await ensureWebPushSubscription(userId);
  }
};

export const triggerPushForActivity = async (payload: {
  group_id?: string;
  date: string;
  juz_number: number;
  activity_type: 'audio_added' | 'plan_updated' | 'plan_cleared';
  actor_user_id: string;
}) => {
  const { error } = await supabase.functions.invoke('send-push-notification', {
    body: payload,
  });
  if (error) {
    console.error('Error triggering push function:', error);
  }
};
