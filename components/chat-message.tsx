"use client";

import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const formattedTime = format(new Date(message.timestamp), "h:mm a");

  return (
    <div
      className={cn(
        "flex items-start space-x-4",
        message.role === "assistant" ? "justify-start" : "justify-end"
      )}
    >
      {message.role === "assistant" && (
        <Avatar className="h-8 w-8 border bg-primary/10 items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </Avatar>
      )}

      <div
        className={cn(
          "space-y-2 max-w-[90%]",
          message.role === "user" && "flex flex-col items-end"
        )}
      >
        <Card
          className={cn(
            "px-4 py-3 shadow-sm",
            message.role === "assistant"
              ? "bg-background border-muted"
              : "bg-primary text-primary-foreground"
          )}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>

          {message.citations && message.citations.length > 0 && (
            <Accordion type="single" collapsible className="mt-2">
              <AccordionItem
                value="citations"
                className="border-t border-primary/10"
              >
                <AccordionTrigger className="text-sm opacity-80 py-2">
                  Source Citations
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="text-sm space-y-1 opacity-90 list-decimal pl-5">
                    {message.citations.map((citation, index) => (
                      <li key={index}>
                        <span className="font-medium">{citation.source}</span>
                        {citation.page && <span> - Page {citation.page}</span>}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </Card>

        <span className="text-xs text-muted-foreground">{formattedTime}</span>
      </div>

      {message.role === "user" && (
        <Avatar className="h-8 w-8 border bg-secondary/50 items-center justify-center">
          <User className="h-5 w-5 items-center justify-center" />
        </Avatar>
      )}
    </div>
  );
}
