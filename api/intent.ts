import { z } from 'zod';
import { apiError, createSuggestions } from '../backend/openai';

const Input = z.object({ fragments: z.array(z.string().trim().min(1).max(60)).min(1).max(12), context: z.record(z.string(), z.string().max(120)).optional() }).strict();

export default async function handler(req: Request) {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Add between 1 and 12 short intent fragments.' }, { status: 400 });
  try {
    const context = parsed.data.context ? ` Optional personal context: ${JSON.stringify(parsed.data.context)}` : '';
    const suggestions = await createSuggestions(`Fragments of meaning: ${parsed.data.fragments.join(', ')}.${context}`);
    return Response.json({ suggestions });
  } catch (error) {
    const result = apiError(error);
    return Response.json(result.body, { status: result.status });
  }
}
