import { directPromptFallback } from './director-fallback.js';
import { validateSceneDocument } from './scene-schema.js';

export async function directPrompt(prompt) {
  try {
    const response = await fetch('/api/direct', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) throw new Error(`AI Director ${response.status}`);
    const payload = await response.json();
    const validation = validateSceneDocument(payload.scene);
    if (!validation.ok) throw new Error(validation.errors.join(' '));
    return { scene: payload.scene, mode: 'llm', model: payload.model || 'OpenAI' };
  } catch (error) {
    return { scene: directPromptFallback(prompt), mode: 'fallback', error: String(error?.message || error) };
  }
}
