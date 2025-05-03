"use client";

import { AIModel } from "@/types/models";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModelSelectorProps {
  selectedModel: AIModel | string;
  onSelect: (model: AIModel) => void;
}

export function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Model:</span>
      <Select
        value={selectedModel}
        onValueChange={(value) => {
          onSelect(value as any);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Model" />
        </SelectTrigger>
        <SelectContent>
          {/* <SelectItem value="openai">General GPT</SelectItem> */}
          <SelectItem value="openai">Agentic GPT (Recommended)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
