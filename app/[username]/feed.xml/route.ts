import { redirect } from 'next/navigation';

export function GET({ params }: { params: { username: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tinymind.me';
  redirect(`${baseUrl}/api/rss/${params.username}`);
}
