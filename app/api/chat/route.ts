import { Pinecone } from "@pinecone-database/pinecone";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ChatRequest, ChatResponse, Message } from "@/types/chat";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
// import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { ChatMessage } from "@langchain/core/messages";
import { PineconeTranslator } from "@langchain/pinecone";
export const dynamic = "force-dynamic";

// Initialize API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const pineconeInstance = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || "",
});

const llmInstance = new ChatOpenAI({
  model:
    process.env.ENVIRONMENT === "development"
      ? "gpt-4o-mini"
      : "gpt-4.1-2025-04-14",
});

const existingIndex = pineconeInstance
  .index(
    "clinical-research-data",
    "clinical-research-data-edpdmqo.svc.aped-4627-b74a.pinecone.io"
  )
  .namespace("gcp_guidelines");

const getIndexInfo = async () => {
  return await pineconeInstance.listIndexes();
};

function indexInfoRetriever() {
  getIndexInfo().then((res) => {
    console.log(res);
  });
}

// indexInfoRetriever();

const embeddingInstance = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
  apiKey: process.env.OPENAI_API_KEY || "",
  openAIApiKey: process.env.OPENAI_API_KEY || "",
});

// System prompt for clinical research context
const OLD_SYSTEM_PROMPT =
  `You are an AI assistant specialized in Good Clinical Practice (GCP) and clinical research compliance.
Your purpose is to provide accurate, clear, and helpful information to clinical research professionals.
Always cite your sources when possible.
Be concise and direct in your responses.
If you don't know the answer, say so rather than providing potentially incorrect information. Don't use bolded words of any kind, stick tor regular words and make sure to use appropriate spacing and formatting such as bullet points and numbering to make sure the text is easy to read.`.toString();

const UPDATED_SYSTEM_PROMPT = ChatPromptTemplate.fromTemplate(`
You are an expert in clinical research and Good Clinical Practice (GCP).
Answer the question based only on the following context.
If you don't know the answer based on the context, say "I don't have enough information to answer this question", but also provide information about what kind of topic your able to answer upon. Also suggest sample questions that you can answer in an accurate manner that user can ask. Note that if you don't have the context to answer the particular question, mention that but also provide a seperate response describing what you found searching the internet.

Context:
{context}

Question: {question}

Answer:
`);

export async function POST(request: NextRequest) {
  try {
    let chatHistory: ChatMessage[] = [];
    const { message, history }: ChatRequest = await request.json();
    const constructNewMessage = new ChatMessage(message.toString(), "user");

    chatHistory.push(constructNewMessage);

    // console.log(`History Data : ${JSON.stringify(history)}`);
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }
    const vectorStoreInstance = await PineconeStore.fromExistingIndex(
      embeddingInstance,
      {
        pineconeIndex: existingIndex,
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
      llm: llmInstance,
      vectorStore: vectorStoreInstance,
      documentContents:
        "Information about Good Clinical Practice (GCP) guidelines for clinical trials and research best practices",
      attributeInfo: attributeInfo,
      structuredQueryTranslator: new PineconeTranslator(),
    });

    const formatDocsModified = (docs: Document[]) => {
      return docs
        .map((doc) => {
          return `Content: ${doc.pageContent}\nMetadata: ${JSON.stringify(
            doc.metadata
          )}\nID: ${doc.id || "N/A"}\n`;
        })
        .join("\n---\n");
    };

    const ragChainInstance = RunnableSequence.from([
      {
        context: selfQueryRetrieverInstance.pipe(formatDocsModified),
        question: new RunnablePassthrough(),
      },
      UPDATED_SYSTEM_PROMPT,
      llmInstance,
      new StringOutputParser(),
    ]);

    let ragChainResponse = "";

    try {
      ragChainResponse = await ragChainInstance.invoke(message);
    } catch (error) {
      console.error("Error invoking rag model : ", error);
    }

    // console.log(`Fetched information : ${response.text}`);
    const citations = extractCitations(ragChainResponse);
    return NextResponse.json({
      id: crypto.randomUUID(), // or any unique ID
      role: "assistant",
      // content: response.text,
      content:
        ragChainResponse === ""
          ? "Unable to retrieve a response, please try again"
          : ragChainResponse,
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

async function _handleOpenAIRequest(
  message: string,
  history: Message[]
): Promise<ChatResponse> {
  const messages = [
    { role: "system", content: OLD_SYSTEM_PROMPT },
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
  const citations = extractCitations(responseText);

  return {
    text: responseText,
    citations,
  };
}

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
