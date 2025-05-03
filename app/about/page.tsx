import { AboutContent } from '@/components/about-content';
import { Header } from '@/components/header';

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-background to-background/90">
      <Header />
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <AboutContent />
      </div>
    </main>
  );
}