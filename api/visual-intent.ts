import { z } from 'zod';
import { apiError, createSuggestions } from '../backend/openai';

type ApiRequest = { method?: string; body?: unknown };
type ApiResponse = { status(code: number): ApiResponse; json(body: unknown): void };
const Input = z.object({ image: z.string().min(100).max(5_000_000) }).strict();

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const parsed = Input.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Choose an image smaller than 4 MB.' });
  try {
    const suggestions = await createSuggestions([{ role: 'user', content: [{ type: 'input_text', text: 'Study the visual context. Suggest three distinct things the person may want to communicate. Do not merely identify objects.' }, { type: 'input_image', image_url: `data:image/jpeg;base64,${parsed.data.image}`, detail: 'low' }] }]);
    return res.status(200).json({ suggestions });
  } catch (error) {
    const result = apiError(error);
    return res.status(result.status).json(result.body);
  }
}
