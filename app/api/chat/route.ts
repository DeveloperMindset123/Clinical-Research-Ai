import { pineconeIndex } from "./../../../lib/pinecone";
import { schema } from "./../../../node_modules/@hookform/resolvers/ajv/src/__tests__/__fixtures__/data";
import { ConversationalRetrievalAgentOptions } from "./../../../node_modules/langchain/dist/agents/toolkits/conversational_retrieval/openai_functions.d";
import { Pinecone } from "@pinecone-database/pinecone";
// import { Pinecone } from "@pinecone-database/pinecone";
import { VectorStores } from "./../../../node_modules/openai/src/resources/vector-stores/vector-stores";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ChatRequest, ChatResponse, Message } from "@/types/chat";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
// import { PineconeStore } from "@langchain/community/vectorstores/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { ConversationalRetrievalQAChain } from "langchain/chains";
// import { pineconeIndex } from "@/lib/pinecone";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatMessage } from "langchain/schema";
export const dynamic = "force-dynamic";

// Initialize API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// System prompt for clinical research context
const SYSTEM_PROMPT =
  `You are an AI assistant specialized in Good Clinical Practice (GCP) and clinical research compliance.
Your purpose is to provide accurate, clear, and helpful information to clinical research professionals.
Always cite your sources when possible.
Be concise and direct in your responses.
If you don't know the answer, say so rather than providing potentially incorrect information. Don't use bolded words of any kind, stick tor regular words and make sure to use appropriate spacing and formatting such as bullet points and numbering to make sure the text is easy to read.`.toString();

export async function POST(request: NextRequest) {
  try {
    // console.log(`request : ${request.json()}`);
    let chatHistory: ChatMessage[] = [];
    const { message, history }: ChatRequest = await request.json();
    const constructNewMessage = new ChatMessage(message.toString(), "user");

    chatHistory.push(constructNewMessage);

    console.log(`History Data : ${JSON.stringify(history)}`);
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // const QA_PROMPT = PromptTemplate.fromTemplate(
    //   `${SYSTEM_PROMPT}\n\n{context}\n\nQuestion: {question}`.toString()
    // );

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      apiKey: process.env.OPENAI_API_KEY,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const pinecone = new PineconeClient();
    const pineconeIndex: any = pinecone.Index("clinical-research-data");

    console.log(`Pinecone index is ${pineconeIndex}`);
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace: "gcp_guidelines",
      maxConcurrency: 5,
    });

    const model = new ChatOpenAI({
      modelName: "gpt-4-turbo",
      temperature: 0.3,
      openAIApiKey: process.env.OPENAI_API_KEY!,
    });

    // const chain = ConversationalRetrievalQAChain.fromLLM(
    //   model,
    //   vectorStore.asRetriever()
    //   // {
    //   //   // qaChainOptions: QA_PROMPT,
    //   //   qaTemplate: QA_PROMPT,
    //   // }
    // );

    // const response = await chain.call({
    //   question: message,
    //   // chat_history: history || [],
    //   chat_history: chatHistory,
    // });

    // console.log(`Fetched information : ${response.text}`);
    const citations = extractCitations(response.text);

    // return NextResponse.json({
    //   result: response.text,
    //   citations: extractCitations(response.text),
    // });
    return NextResponse.json({
      id: crypto.randomUUID(), // or any unique ID
      role: "assistant",
      content: response.text,
      timestamp: new Date().toISOString(),
      citations: citations,
    });
  } catch (error) {
    console.error("Error processing chat request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

async function handleOpenAIRequest(
  message: string,
  history: Message[]
): Promise<ChatResponse> {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: messages as any,
    temperature: 0.3,
    max_tokens: 2000,
  });

  const responseText = chatCompletion.choices[0].message.content || "";

  // Simple citation extraction (would be more sophisticated in production)
  const citations = extractCitations(responseText);

  return {
    text: responseText,
    citations,
  };
}

// Basic citation extraction function
// function extractCitations(text: string) {
//   const citations = [];
//   const citationRegex = /\[([^\]]+)\]/g;
//   let match;

//   while ((match = citationRegex.exec(text)) !== null) {
//     const citation = match[1];

//     // Simple parsing of citation format like "[ICH GCP E6(R2), p.23]"
//     const parts = citation.split(",");
//     const source = parts[0].trim();
//     let page = undefined;

//     if (parts.length > 1) {
//       const pageMatch = parts[1].match(/p\.?\s*(\d+)/i);
//       if (pageMatch) {
//         page = parseInt(pageMatch[1], 10);
//       }
//     }

//     citations.push({
//       source,
//       page,
//     });
//   }
//   return citations;
// }

function extractCitations(text: string) {
  const citations = [];
  const citationRegex = /\[([^\]]+)\]/g;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    const citation = match[1].toString();
    const parts = citation.split(",");
    const source = parts[0].trim();
    let page = undefined;

    if (parts.length > 1) {
      const pageMatch = parts[1].match(/p\.?\s*(\d+)/i);
      if (pageMatch) {
        page = parseInt(pageMatch[1], 10);
      }
    }

    citations.push({ source, page });
  }
  return citations;
}
