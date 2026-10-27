import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h2 className="font-display text-4xl font-bold mb-2">Page Not Found</h2>
      <p className="text-[var(--mute)] text-sm mb-6">Could not find requested resource</p>
      <Link href="/" className="btn-primary text-sm py-2.5 px-6">
        Return to Home
      </Link>
    </div>
  );
}
