// =====================================================================
// telegram-notify — send a Telegram message via Bot API (Edge Function)
// =====================================================================
// Authenticated users POST { text }; the function relays it to the chat
// configured via secrets so the bot token never reaches the browser.
//
// Setup:
//   1. Create a bot via @BotFather → get TELEGRAM_BOT_TOKEN
//   2. Add the bot to your group/channel, or message it and get your
//      chat id via https://api.telegram.org/bot<TOKEN>/getUpdates
//   3. supabase secrets set TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=...
// =====================================================================
import { corsHeaders, createAdminClient, errorResponse, json, verifyUser } from '../_shared/knowledge.ts';

const TELEGRAM_API = 'https://api.telegram.org';
const MAX_TEXT_LENGTH = 4000;
const FETCH_TIMEOUT_MS = 10000;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('POST only.', 405);

  try {
    const supabase = createAdminClient();
    const { user } = await verifyUser(req, supabase);
    if (!user) return errorResponse('Authentication required.', 401);

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID') ?? '';
    if (!botToken || !chatId) {
      return errorResponse('Telegram notifications are not configured on the server.', 503);
    }

    const body = await req.json().catch(() => null);
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) return errorResponse('Message text is required.', 400);
    if (text.length > MAX_TEXT_LENGTH) {
      return errorResponse(`Message too long (max ${MAX_TEXT_LENGTH} chars).`, 400);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let upstream: Response;
    try {
      upstream = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok || !payload?.ok) {
      console.warn('[telegram-notify] Telegram API error:', payload?.description || upstream.status);
      return errorResponse(payload?.description || 'Telegram delivery failed.', 502);
    }

    return json({ ok: true, message_id: payload.result?.message_id });
  } catch (err) {
    console.error('telegram-notify error:', err);
    return errorResponse((err as Error).message || 'Notification failed.', 500);
  }
});
