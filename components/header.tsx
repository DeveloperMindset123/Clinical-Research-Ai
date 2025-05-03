import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Stethoscope } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Clinical Research AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/about">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              About
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}