import { z } from 'zod';
import { apiError, createSuggestions, transcribeAudio } from '../backend/openai';

type ApiRequest = { method?: string; body?: unknown };
type ApiResponse = { status(code: number): ApiResponse; json(body: unknown): void };
const Input = z.object({ audio: z.string().min(100).max(5_000_000), mimeType: z.enum(['audio/m4a', 'audio/mp4', 'audio/3gpp', 'audio/webm']) }).strict();
export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const parsed = Input.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Record a short voice message and try again.' });
  try {
    const transcript = await transcribeAudio(parsed.data.audio, parsed.data.mimeType);
    if (!transcript) return res.status(422).json({ error: 'No speech was detected.' });
    const suggestions = await createSuggestions(`The user spoke this incomplete or uncertain communication attempt: ${transcript}`);
    return res.status(200).json({ transcript, suggestions });
  } catch (error) {
    const result = apiError(error);
    return res.status(result.status).json(result.body);
  }
}
