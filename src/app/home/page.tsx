import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <h1 className="text-4xl font-bold mb-6">Welcome to Flatify AI</h1>
      <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
        Generate unique, professional flat design logos effortlessly using advanced AI.
      </p>
      <div className="flex gap-4">
        <Link href="/role-select">
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-md text-lg font-semibold hover:bg-primary/90 transition-colors">
            Get Started
          </button>
        </Link>
        <Link href="/dashboard">
          <button className="px-6 py-3 border border-primary text-primary rounded-md text-lg font-semibold hover:bg-primary/10 transition-colors">
            View Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
