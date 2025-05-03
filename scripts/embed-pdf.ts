// scripts/embed-pdf.ts
import fs from "fs";
import pdf from "pdf-parse";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const index = pinecone.Index("clinical-research-data");

async function ingestPDF(path: string, namespace: string) {
  const dataBuffer = fs.readFileSync(path);
  const parsed = await pdf(dataBuffer);

  const chunks = parsed.text.match(/[\s\S]{1,1000}/g) || [];

  for (const [i, chunk] of chunks.entries()) {
    const embed = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunk,
    });

    await index.upsert([
      {
        id: `${namespace}-${i}`,
        values: embed.data[0].embedding,
        metadata: { text: chunk },
      },
    ]);
  }

  console.log(`✅ Uploaded ${chunks.length} chunks from ${path}`);
}

async function main(): Promise<void> {
  await Promise.all([
    await ingestPDF("documents/clinical-research-doc-1.pdf", "gcp_guidelines"),
    await ingestPDF("documents/clinical-research-doc-2.pdf", "gcp_guidelines"),
    await ingestPDF("documents/clinical-research-doc-3.pdf", "gcp_guidelines"),
  ]);
}

main();
