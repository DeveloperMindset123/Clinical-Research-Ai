import { ChatInterface } from '@/components/chat-interface';
import { Header } from '@/components/header';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-background to-background/90">
      <Header />
      <div className="container mx-auto max-w-5xl px-4 py-6 flex-1 flex flex-col">
        <ChatInterface />
      </div>
    </main>
  );
}