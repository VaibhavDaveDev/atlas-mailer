// Fire-and-forget: posts a JSON payload to the callbackUrl.
// Never throws — a broken webhook must not fail or re-retry the queue message.
export async function fireWebhook(
  callbackUrl: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await fetch(callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error(JSON.stringify({ event: 'webhook_failed', callbackUrl, error: String(e) }));
  }
}
