import { z } from 'zod';
import { apiError, createSuggestions } from '../backend/openai';

type ApiRequest = { method?: string; body?: unknown };
type ApiResponse = { status(code: number): ApiResponse; json(body: unknown): void };
const Input = z.object({ images: z.array(z.string().min(100).max(2_000_000)).length(3) }).strict();

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const parsed = Input.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Capture exactly three small frames.' });
  try {
    const imageContent = parsed.data.images.map(image => ({ type: 'input_image' as const, image_url: `data:image/jpeg;base64,${image}`, detail: 'low' as const }));
    const suggestions = await createSuggestions([{ role: 'user', content: [{ type: 'input_text', text: 'These three frames show one short real-world moment in chronological order. Infer the situation across the frames and suggest three distinct things the person may want to communicate. Do not merely identify objects. Never claim certainty about intent.' }, ...imageContent] }]);
    return res.status(200).json({ suggestions });
  } catch (error) {
    const result = apiError(error);
    return res.status(result.status).json(result.body);
  }
}
