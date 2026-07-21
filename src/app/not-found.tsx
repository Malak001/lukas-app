import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 text-center">
      <Link href="/" className="mb-6 text-2xl font-bold text-primary-600">
        Luka&apos;s
      </Link>
      <h1 className="text-xl font-semibold text-stone-900">Page not found</h1>
      <p className="mt-2 text-sm text-stone-600">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
