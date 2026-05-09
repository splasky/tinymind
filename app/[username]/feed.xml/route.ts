import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export function GET(
  _request: NextRequest,
  { params }: { params: { username: string } }
) {
  redirect(`/api/rss/${params.username}`);
}
