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
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com';

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

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
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
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
      .select('endpoint, p256dh, auth')
      .in('user_id', memberIds);
    if (subsError) throw subsError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const staleEndpoints: string[] = [];
    let sent = 0;
    for (const sub of subscriptions as { endpoint: string; p256dh: string; auth: string }[]) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
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
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error('Push send error:', err);
        }
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
