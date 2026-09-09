import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  return params.then(({ username }) => redirect(`/api/rss/${username}`));
}
