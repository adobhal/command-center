import NextAuth from 'next-auth';

// Dynamic import so auth config (and db) only load at request time, not during build
// This allows Vercel build to succeed before DATABASE_URL is configured
async function getHandler() {
  const { authOptions } = await import('@/lib/infrastructure/auth/config');
  return NextAuth(authOptions);
}

export async function GET(req: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  const handler = await getHandler();
  return handler(req as never, context as never);
}

export async function POST(req: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  const handler = await getHandler();
  return handler(req as never, context as never);
}
