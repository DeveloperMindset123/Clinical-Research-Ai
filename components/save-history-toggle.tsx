"use client";

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface SaveHistoryToggleProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

export function SaveHistoryToggle({ enabled, onToggle }: SaveHistoryToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="save-history"
        checked={enabled}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="save-history" className="text-sm font-medium">
        Save History
      </Label>
    </div>
  );
}