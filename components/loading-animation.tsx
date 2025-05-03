"use client";

import { useEffect, useState } from "react";
import { Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

const loadingMessages = [
  "Analyzing clinical research guidelines...",
  "Reviewing GCP documentation...",
  "Checking regulatory compliance standards...",
  "Validating peer-reviewed citations...",
  "Cross-referencing industry best practices...",
  "Examining protocol requirements...",
  "Verifying ICH guidelines...",
  "Consulting FDA regulations...",
];

export function LoadingAnimation() {
  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => {
        const currentIndex = loadingMessages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-start space-x-4">
      <Avatar className="h-8 w-8 border bg-primary/10">
        <Bot className="h-5 w-5 text-primary animate-pulse" />
      </Avatar>

      <div className="space-y-2 max-w-[90%]">
        <Card className="px-4 py-3 shadow-sm bg-background border-muted">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div
                className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-muted-foreground">{currentMessage}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
