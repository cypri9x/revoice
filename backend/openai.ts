import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

export const SuggestionOutput = z.object({ suggestions: z.array(z.string().min(1).max(180)).length(3) });
const system = `You are an assistive communication interpretation engine for ReVoice.
Return exactly three short, meaningfully distinct possible sentences the user may intend to communicate.
Preserve uncertainty. Never choose for the user. Never add medical advice or diagnose anything.
Use simple, natural English. Each suggestion must be ready to speak aloud.`;

export async function createSuggestions(input: string | OpenAI.Responses.ResponseInput) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 15_000, maxRetries: 1 });
  const response = await client.responses.parse({ model: 'gpt-4.1-mini', instructions: system, input, max_output_tokens: 350, text: { format: zodTextFormat(SuggestionOutput, 'suggestions') } });
  if (!response.output_parsed) throw new Error('The model returned an incomplete response');
  return SuggestionOutput.parse(response.output_parsed).suggestions.map(value => value.trim());
}

export async function transcribeAudio(audio: string, mimeType: string) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 20_000, maxRetries: 1 });
  const extension = mimeType.includes('webm') ? 'webm' : 'm4a';
  const file = await toFile(Buffer.from(audio, 'base64'), `revoice-input.${extension}`, { type: mimeType });
  const result = await client.audio.transcriptions.create({ file, model: 'gpt-4o-mini-transcribe', language: 'en', prompt: 'Assistive communication fragments or an incomplete sentence.' });
  return result.text.trim();
}

export function apiError(error: unknown) {
  const config = error instanceof Error && error.message.includes('OPENAI_API_KEY');
  return { status: config ? 503 : 502, body: { error: config ? 'AI suggestions are not configured yet.' : 'Suggestions are temporarily unavailable.' } };
}
