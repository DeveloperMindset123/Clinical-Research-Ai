import { fields } from "./../node_modules/@hookform/resolvers/ajv/src/__tests__/__fixtures__/data";
// scripts/test-retriever.ts
// import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { PineconeTranslator } from "@langchain/pinecone";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
// 1. Setup Pinecone and LangChain clients
const pinecone = new Pinecone({
  apiKey: "replace with pinecone key here",
});

const llm = new ChatOpenAI({
  // model: "gpt-4o-mini", // dev
  model: "gpt-4.1-2025-04-14", // prod
  temperature: 0,
  apiKey: "replace with gpt key here",
});
const index = pinecone
  .index(
    "clinical-research-data",
    "clinical-research-data-edpdmqo.svc.aped-4627-b74a.pinecone.io"
  )
  .namespace("gcp_guidelines");

const retrieveIndexRelatedInfo = async () => {
  return await pinecone.listIndexes();
};

const query = "can you explain in simple terms what is GCP?";

// retrieveIndexRelatedInfo().then((res) => {
//   console.log(res);
// });

const run = async () => {
  const embeddings = new OpenAIEmbeddings({
    // apiKey: process.env.OPENAI_API_KEY,
    apiKey: "replace with gpt key here",
  });

  // 2. Connect to vector store
  const vectorStoreInstance = await PineconeStore.fromExistingIndex(
    embeddings,
    {
      pineconeIndex: index,
    }
  );

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
    {
      name: "source",
      description:
        "The specific document from which the information was retrieved",
      type: "string or array of strings",
    },
    {
      name: "summary",
      description:
        "Reduce the information down to proper sentences such that humans can read and understand it",
      type: "string",
    },
  ];

  const selfQueryRetrieverInstance = SelfQueryRetriever.fromLLM({
    llm: llm,
    vectorStore: vectorStoreInstance,
    documentContents:
      "Information about Good Clinical Practice (GCP) guidelines for clinical trials and research best practices",
    attributeInfo: attributeInfo,
    structuredQueryTranslator: new PineconeTranslator(),
  });

  // const selfQueryInvokationRes = await selfQueryRetrieverInstance.invoke(query);

  const formatDocsModified = (docs: Document[]) => {
    return docs
      .map((doc) => {
        return `Content: ${doc.pageContent}\nMetadata: ${JSON.stringify(
          doc.metadata
        )}\nID: ${doc.id || "N/A"}\n`;
      })
      .join("\n---\n");
  };
  const sample_query = "what is the most adverse event of FDA?";
  const systemPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert in clinical research and Good Clinical Practice (GCP).
Answer the question based only on the following context.
If you don't know the answer based on the context, say "I don't have enough information to answer this question", but also provide information about what kind of topic your able to answer upon. Also suggest sample questions that you can answer in an accurate manner that user can ask. Note that if you don't have the context to answer the particular question, mention that but also provide a seperate response describing what you found searching the internet.

Context:
{context}

Question: {question}

Answer:
`);

  const ragChainCreation = RunnableSequence.from([
    {
      context: selfQueryRetrieverInstance.pipe(formatDocsModified),
      question: new RunnablePassthrough(),
    },
    systemPrompt,
    llm,
    new StringOutputParser(),
  ]);

  // console.log(selfQueryInvokationRes);
  // const similaritySearchTest = await vectorStoreInstance.similaritySearch(
  //   query,
  //   5
  // );
  // console.log(similaritySearchTest);

  const sample_answerable_question1 =
    "How are serious adverse events defined in clinical research?";

  const sample_answerable_question2 =
    "What is the significance of an audit trial in clinical investigations?";

  const sample_answerable_question3 =
    "Can you explain the difference between single-binding and double blinding in clinical trials?";

  const sample_answerable_question4 =
    "What information must be included in a consent document regarding research-related injuries?";

  try {
    const ragChainTest = await ragChainCreation.invoke(
      "What contact information must be included in an informed consent document?"
    );
    // const ragChainTest2 = await ragChainCreation.invoke(
    //   sample_answerable_question2
    // );
    // const ragChainTest3 = await ragChainCreation.invoke(
    //   sample_answerable_question3
    // );
    // const ragChainTest4 = await ragChainCreation.invoke(
    //   sample_answerable_question4
    // );
    console.log(ragChainTest);
    console.log("\n\n");
    // console.log(ragChainTest2);
    // console.log("\n\n");
    // console.log(ragChainTest3);
    // console.log("\n\n");
    // console.log(ragChainTest4);
    // console.log("\n\n");
  } catch (error) {
    console.error("Error with rag chain : ", error);
  }

  // requires integrated embedding
  //   const searchWithText = await index.searchRecords({
  //     query: {
  //       topK: 2,
  //       inputs: {
  //         text: "can you explain in simple terms what is GCP?",
  //       },
  //       //   fields: ["chunk_text", "quarter"],
  //     },
  //   });

  //   console.log(searchWithText);

  // 3. Create retriever
  const retriever = vectorStoreInstance.asRetriever();

  //   const results = await retriever.invoke(query);
  const results = await vectorStoreInstance.similaritySearch(query, 3);
  //   console.log(results);
  //   console.log(results);

  const mmr_results = await vectorStoreInstance.maxMarginalRelevanceSearch(
    query,
    {
      k: 5,
      fetchK: 20,
    }
  );

  // console.log(mmr_results);

  //   console.log(mmr_results);
  // mmr_results.forEach((data) => console.log(data));
  //   console.log("📄 Retrieved Documents:");
  //   results.forEach((doc, i) => {
  //     console.log(`\n[${i + 1}] ${doc.metadata.text?.slice(0, 300)}...`);
  //   });
};

run().catch(console.error);
