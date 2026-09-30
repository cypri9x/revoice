import { z } from 'zod';
import { apiError, createSuggestions } from '../backend/openai';

const Input = z.object({ image: z.string().min(100).max(5_000_000) }).strict();

export default async function handler(req: Request) {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Choose an image smaller than 4 MB.' }, { status: 400 });
  try {
    const suggestions = await createSuggestions([{ role: 'user', content: [{ type: 'input_text', text: 'Study the visual context. Suggest three distinct things the person may want to communicate. Do not merely identify objects.' }, { type: 'input_image', image_url: `data:image/jpeg;base64,${parsed.data.image}`, detail: 'low' }] }]);
    return Response.json({ suggestions });
  } catch (error) {
    const result = apiError(error);
    return Response.json(result.body, { status: result.status });
  }
}
