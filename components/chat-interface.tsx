"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Send, StopCircle } from "lucide-react";
import { Message } from "@/types/chat";
import { ChatMessage } from "@/components/chat-message";
import { ModelSelector } from "@/components/model-selector";
import { AIModel } from "@/types/models";
import { SaveHistoryToggle } from "@/components/save-history-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { LoadingAnimation } from "@/components/loading-animation";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("openai");
  const [saveHistory, setSaveHistory] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const { toast } = useToast();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (saveHistory) {
      const savedMessages = localStorage.getItem("chatHistory");
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (e) {
          console.error("Failed to parse saved messages", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (saveHistory && messages.length > 0) {
      localStorage.setItem("chatHistory", JSON.stringify(messages));
    }
  }, [messages, saveHistory]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          model: selectedModel,
          history: saveHistory ? messages : [],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      console.log(`Recieved : ${JSON.stringify(data)}`);
      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: data.content,
        timestamp: new Date().toISOString(),
        citations: data.citations || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      recorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });

      recorder.addEventListener("stop", async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", audioBlob);

        setIsLoading(true);
        try {
          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Failed to transcribe audio");
          }

          const data = await response.json();
          setInput(data.text);

          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        } catch (error) {
          console.error("Error transcribing audio:", error);
          toast({
            title: "Transcription Error",
            description: "Failed to transcribe audio. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }

        stream.getTracks().forEach((track) => track.stop());
      });

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone Error",
        description:
          "Failed to access your microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem("chatHistory");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 space-x-4">
        <div className="flex items-center space-x-4">
          <ModelSelector
            selectedModel={selectedModel}
            onSelect={setSelectedModel}
          />
          <SaveHistoryToggle enabled={saveHistory} onToggle={setSaveHistory} />
        </div>
        {messages.length > 0 && (
          <Button variant="outline" onClick={clearHistory}>
            Clear Chat
          </Button>
        )}
      </div>

      <Card className="flex-1 mb-4 overflow-hidden border-muted">
        <ScrollArea className="h-[calc(100vh-260px)] w-full px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-semibold mb-2">
                  Welcome to Clinical Research AI
                </h2>
                <p className="text-muted-foreground">
                  Ask questions about Good Clinical Practice (GCP) and
                  compliance guidelines. I&apos;m here to help with your
                  clinical research questions.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && <LoadingAnimation />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </Card>

      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about GCP or clinical research compliance..."
          className="min-h-[80px] pr-24"
          disabled={isLoading || isRecording}
        />
        <div className="absolute right-2 bottom-2 flex items-center space-x-2">
          {isRecording ? (
            <Button
              variant="destructive"
              size="icon"
              onClick={stopRecording}
              disabled={isLoading}
            >
              <StopCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="icon"
              onClick={startRecording}
              disabled={isLoading}
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading || isRecording}
          >
            <Send className="h-5 w-5 mr-2" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
