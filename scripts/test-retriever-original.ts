// playground to create agentic AI
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { PineconeTranslator } from "@langchain/pinecone";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { Document } from "@langchain/core/documents";

// 1. Setup Pinecone and LangChain clients
const pinecone = new Pinecone({
  apiKey: "replace with pinecone api key here",
});

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  apiKey: "replace with gpt api key here",
});

const indexName = "clinical-research-data";
const indexAddress =
  "clinical-research-data-edpdmqo.svc.aped-4627-b74a.pinecone.io";
const namespace = "gcp_guidelines";
const index = pinecone.index(indexName, indexAddress);

const run = async () => {
  console.log("Starting retrieval test...");

  // Initialize embeddings
  const embeddings = new OpenAIEmbeddings({
    apiKey: "replace with openai api key here",
  });
  const vectorStoreInstance = await PineconeStore.fromExistingIndex(
    embeddings,
    {
      pineconeIndex: index,
      namespace: namespace,
    }
  );

  console.log("Connected to Pinecone vector store");
  // Based on your document structure, adjust these as needed
  const attributeInfo = [
    {
      name: "id",
      description: "The unique identifier for the document section",
      type: "string",
    },
    {
      name: "section",
      description: "The section of the GCP guidelines",
      type: "string",
    },
  ];

  // 4. Create the self-query retriever
  const selfQueryRetriever = SelfQueryRetriever.fromLLM({
    llm: llm,
    vectorStore: vectorStoreInstance,
    documentContents:
      "Information about Good Clinical Practice (GCP) guidelines for clinical trials and research",
    attributeInfo: attributeInfo,
    structuredQueryTranslator: new PineconeTranslator(),
  });

  console.log("Self-query retriever created");
  const formatDocs = (docs: Document[]) => {
    return docs
      .map((doc) => {
        return `Content: ${doc.pageContent}\nMetadata: ${JSON.stringify(
          doc.metadata
        )}\nID: ${doc.id || "N/A"}\n`;
      })
      .join("\n---\n");
  };

  // 6. Create a RAG chain
  const prompt = ChatPromptTemplate.fromTemplate(`
You are an expert in clinical research and Good Clinical Practice (GCP).
Answer the question based only on the following context.
If you don't know the answer based on the context, say "I don't have enough information to answer this question."

Context:
{context}

Question: {question}

Answer:
`);

  const ragChain = RunnableSequence.from([
    {
      context: selfQueryRetriever.pipe(formatDocs),
      question: new RunnablePassthrough(),
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  // 7. Test the different retrieval methods
  console.log("\n=== Testing Regular Similarity Search ===");
  const query = "what constitutes good clinical practice?";
  const similarityResults = await vectorStoreInstance.similaritySearch(
    query,
    3
  );
  console.log(
    `Found ${similarityResults.length} documents via similarity search`
  );
  similarityResults.forEach((doc, i) => {
    console.log(`\n[Document ${i + 1}]`);
    console.log(`ID: ${doc.id || "N/A"}`);
    console.log(`Content: ${doc.pageContent.slice(0, 200)}...`);
  });

  console.log("\n=== Testing MMR Search ===");
  const mmrResults = await vectorStoreInstance.maxMarginalRelevanceSearch(
    query,
    {
      k: 3,
      fetchK: 10,
    }
  );
  console.log(`Found ${mmrResults.length} documents via MMR search`);
  mmrResults.forEach((doc, i) => {
    console.log(`\n[Document ${i + 1}]`);
    console.log(`ID: ${doc.id || "N/A"}`);
    console.log(`Content: ${doc.pageContent.slice(0, 200)}...`);
  });

  console.log("\n=== Testing Self-Query Retriever ===");
  try {
    const selfQueryResults = await selfQueryRetriever.invoke(query);
    console.log(`Found ${selfQueryResults.length} documents via self-query`);
    selfQueryResults.forEach((doc, i) => {
      console.log(`\n[Document ${i + 1}]`);
      console.log(`ID: ${doc.id || "N/A"}`);
      console.log(`Content: ${doc.pageContent.slice(0, 200)}...`);
    });
  } catch (error) {
    console.error("Error with self-query:", error);
  }

  console.log("\n=== Testing RAG Chain ===");
  try {
    const answer = await ragChain.invoke(query);
    console.log("RAG Chain Answer:");
    console.log(answer);
  } catch (error) {
    console.error("Error with RAG chain:", error);
  }

  console.log("\n=== Testing Filtered Search ===");
  try {
    const filter = {
      id: { $eq: "gcp_guidelines" }, // This would filter for a specific document ID
    };

    const filteredResults = await vectorStoreInstance.similaritySearch(
      "What is good clinical practice consist of?",
      3,
      filter
    );

    console.log(
      `Found ${filteredResults.length} documents via filtered search`
    );
    filteredResults.forEach((doc, i) => {
      console.log(`\n[Document ${i + 1}]`);
      console.log(`ID: ${doc.id || "N/A"}`);
      console.log(`Content: ${doc.pageContent.slice(0, 200)}...`);
    });
  } catch (error) {
    console.error("Error with filtered search:", error);
  }
};

run().catch((error) => {
  console.error("Script error:", error);
});
