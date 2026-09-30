const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

async function parseResponse(response: Response): Promise<string[]> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Suggestions are unavailable right now.');
  if (!Array.isArray(data.suggestions) || data.suggestions.length !== 3) throw new Error('The suggestion response was incomplete.');
  return data.suggestions;
}

export async function getIntentSuggestions(fragments: string[]) {
  if (!API_BASE_URL) throw new Error('Connect the ReVoice backend to use AI suggestions.');
  const response = await fetch(`${API_BASE_URL}/api/intent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fragments }) });
  return parseResponse(response);
}

export async function getVisualIntentSuggestions(images: string[], hint?: string) {
  if (!API_BASE_URL) throw new Error('Connect the ReVoice backend to use Camera Assist.');
  const response = await fetch(`${API_BASE_URL}/api/visual-intent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images, hint: hint?.trim() || undefined }) });
  return parseResponse(response);
}
