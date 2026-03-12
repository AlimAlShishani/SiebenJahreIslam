import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

type ActivityType = 'audio_added' | 'plan_updated' | 'plan_cleared';

interface PushPayload {
  group_id?: string;
  date: string;
  juz_number: number;
  activity_type: ActivityType;
  actor_user_id: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const PUBLISHABLE_KEY = Deno.env.get('PUBLISHABLE_KEY') ?? '';
const ADMIN_SECRET_KEY = Deno.env.get('ADMIN_SECRET_KEY') ?? '';
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com';

async function createFcmJwt(projectId: string, clientEmail: string, privateKey: string): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };
  const encoder = new TextEncoder();
  const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const headerB64 = b64(encoder.encode(JSON.stringify(header)));
  const payloadB64 = b64(encoder.encode(JSON.stringify(payload)));
  const toSign = encoder.encode(`${headerB64}.${payloadB64}`);
  const keyPem = privateKey.replace(/\\n/g, '\n');
  const pemContents = keyPem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, toSign);
  const sigB64 = b64(new Uint8Array(sig));
  return `${headerB64}.${payloadB64}.${sigB64}`;
}

async function getFcmAccessToken(jwt: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('FCM token exchange failed');
  return data.access_token;
}

const getMessage = (activityType: ActivityType, juzNumber: number, actorName: string) => {
  if (activityType === 'plan_updated') {
    return `JUZ ${juzNumber} | ${actorName} hat den Plan neu verteilt`;
  }
  if (activityType === 'plan_cleared') {
    return `JUZ ${juzNumber} | ${actorName} hat die Verteilung gelöscht`;
  }
  return `JUZ ${juzNumber} | ${actorName} hat ein Audio hochgeladen`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!SUPABASE_URL || !PUBLISHABLE_KEY || !ADMIN_SECRET_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing required env vars.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = (await req.json()) as PushPayload;
    if (!payload?.actor_user_id || !payload?.activity_type || !payload?.juz_number) {
      return new Response(JSON.stringify({ error: 'Invalid payload.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const authClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (user.id !== payload.actor_user_id) {
      return new Response(JSON.stringify({ error: 'Forbidden.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, ADMIN_SECRET_KEY);

    let memberIds: string[];
    if (payload.group_id) {
      const { data: groupMembers, error: groupError } = await admin
        .from('reading_group_members')
        .select('user_id')
        .eq('group_id', payload.group_id);
      if (groupError) throw groupError;
      memberIds = Array.from(new Set((groupMembers || []).map((m: { user_id: string }) => m.user_id)));
    } else {
      const { data: groupMembers, error: groupError } = await admin
        .from('reading_group_members')
        .select('user_id');
      if (groupError) throw groupError;
      memberIds = Array.from(new Set((groupMembers || []).map((m: { user_id: string }) => m.user_id)));
    }
    if (!memberIds.includes(payload.actor_user_id) || memberIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: actorProfile } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', payload.actor_user_id)
      .maybeSingle();
    const actorName = actorProfile?.full_name || actorProfile?.email || 'Jemand';
    const message = getMessage(payload.activity_type, payload.juz_number, actorName);

    const { data: subscriptions, error: subsError } = await admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, fcm_token')
      .in('user_id', memberIds);
    if (subsError) throw subsError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const staleEndpoints: string[] = [];
    let sent = 0;

    // Web Push (VAPID)
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    const webSubs = (subscriptions as { endpoint: string; p256dh: string; auth: string; fcm_token?: string }[]).filter(
      (s) => s.fcm_token == null && s.endpoint && !s.endpoint.startsWith('fcm:')
    );
    for (const sub of webSubs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: 'Nuruna',
            body: message,
            url: '/hatim',
            tag: `activity-${payload.activity_type}-juz-${payload.juz_number}`,
          })
        );
        sent += 1;
      } catch (err: any) {
        const statusCode = err?.statusCode;
        if (statusCode === 404 || statusCode === 410) staleEndpoints.push(sub.endpoint);
        else console.error('Push send error:', err);
      }
    }

    // FCM (native Capacitor) – erfordert FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY in Edge Function Secrets
    const fcmSubs = (subscriptions as { fcm_token?: string }[]).filter((s) => s.fcm_token);
    const fcmProjectId = Deno.env.get('FCM_PROJECT_ID');
    const fcmClientEmail = Deno.env.get('FCM_CLIENT_EMAIL');
    const fcmPrivateKey = Deno.env.get('FCM_PRIVATE_KEY');
    if (fcmSubs.length > 0 && fcmProjectId && fcmClientEmail && fcmPrivateKey) {
      try {
        const jwt = await createFcmJwt(fcmProjectId, fcmClientEmail, fcmPrivateKey);
        const accessToken = await getFcmAccessToken(jwt);
        for (const sub of fcmSubs) {
          try {
            const res = await fetch(`https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: {
                  token: sub.fcm_token,
                  notification: { title: 'Nuruna', body: message },
                  data: { url: '/hatim', tag: `activity-${payload.activity_type}-juz-${payload.juz_number}` },
                },
              }),
            });
            if (res.ok) sent += 1;
            else console.error('FCM send error:', await res.text());
          } catch (e) {
            console.error('FCM send error:', e);
          }
        }
      } catch (e) {
        console.error('FCM auth error:', e);
      }
    }

    if (staleEndpoints.length > 0) {
      await admin.from('push_subscriptions').delete().in('endpoint', staleEndpoints);
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-push-notification failed:', err);
    return new Response(JSON.stringify({ error: 'Unexpected server error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
