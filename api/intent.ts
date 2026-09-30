import { z } from 'zod';
import { apiError, createSuggestions } from '../backend/openai';

type ApiRequest = { method?: string; body?: unknown };
type ApiResponse = { status(code: number): ApiResponse; json(body: unknown): void };
const Input = z.object({ fragments: z.array(z.string().trim().min(1).max(60)).min(1).max(12), context: z.record(z.string(), z.string().max(120)).optional() }).strict();

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const parsed = Input.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Add between 1 and 12 short intent fragments.' });
  try {
    const context = parsed.data.context ? ` Optional personal context: ${JSON.stringify(parsed.data.context)}` : '';
    const suggestions = await createSuggestions(`Fragments of meaning: ${parsed.data.fragments.join(', ')}.${context}`);
    return res.status(200).json({ suggestions });
  } catch (error) {
    const result = apiError(error);
    return res.status(result.status).json(result.body);
  }
}
