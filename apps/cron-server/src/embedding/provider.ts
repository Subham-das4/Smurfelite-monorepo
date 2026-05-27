export async function fetchOpenAiEmbeddings(
  apiKey: string,
  model: string,
  inputs: string[]
): Promise<number[][]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, input: inputs }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenAI embeddings failed (${response.status}): ${body.slice(0, 500)}`
    );
  }

  const json = (await response.json()) as {
    data: Array<{ embedding: number[]; index: number }>;
  };

  return json.data
    .sort((a, b) => a.index - b.index)
    .map((row) => row.embedding);
}
