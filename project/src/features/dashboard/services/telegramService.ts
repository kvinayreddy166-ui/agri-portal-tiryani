import { supabase } from '../../../shared/lib/supabase';

export interface TelegramSendResult {
  ok: boolean;
  message_id?: number;
}

/**
 * Sends a text message to the configured Telegram chat via the
 * `telegram-notify` Edge Function. The bot token stays server-side.
 */
export async function sendTelegramMessage(text: string): Promise<TelegramSendResult> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Message text is required.');

  const { data, error } = await supabase.functions.invoke('telegram-notify', {
    body: { text: trimmed },
  });

  if (error) {
    // FunctionsHttpError carries the Edge Function's JSON error body
    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const payload = await context.json();
        if (payload?.error) throw new Error(payload.error);
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== error.message) throw parseErr;
      }
    }
    throw error;
  }

  return (data ?? { ok: true }) as TelegramSendResult;
}
