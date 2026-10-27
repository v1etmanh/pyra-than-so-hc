export function calculateAiCostUsd(input: {
  provider?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
}): number | undefined {
  const provider = `${input.provider || ''} ${input.model || ''}`.toLowerCase();
  const rates = provider.includes('gemini')
    ? { input: 0.30, output: 2.50 }
    : provider.includes('groq') || provider.includes('gpt-oss-20b')
      ? { input: 0.075, output: 0.30 }
      : provider.includes('deepseek')
        ? { input: 0.30, output: 1.20 }
        : null;
  if (!rates || (input.inputTokens == null && input.outputTokens == null)) return undefined;
  return ((input.inputTokens || 0) * rates.input + (input.outputTokens || 0) * rates.output) / 1_000_000;
}
