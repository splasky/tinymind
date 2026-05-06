import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { getBlogPostsPublicFast, getThoughtsPublic, BlogPost, Thought } from '@/lib/githubApi';
import { BoundedCache } from '@/lib/cache';

const rssCache = new BoundedCache<string>(100, 5 * 60 * 1000);

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateRssFeed(
  username: string,
  blogPosts: BlogPost[],
  thoughts: Thought[],
  baseUrl: string
): string {
  const feedUrl = `${baseUrl}/${username}`;
  const title = `${username}'s TinyMind`;
  const description = `Blog posts and thoughts from ${username}`;

  const items: string[] = [];

  for (const post of blogPosts) {
    const contentMatch = post.content.match(/^---[\s\S]*?---\n([\s\S]*)$/);
    const content = contentMatch ? contentMatch[1].trim() : post.content;

    const postDate = new Date(post.date).toUTCString();
    const link = `${feedUrl}/blog/${encodeURIComponent(post.id)}`;

    items.push(`
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(link)}</guid>
      <pubDate>${postDate}</pubDate>
      <description>${escapeXml(content.substring(0, 500))}${content.length > 500 ? '...' : ''}</description>
    </item>`);
  }

  for (const thought of thoughts) {
    const thoughtDate = new Date(thought.timestamp).toUTCString();
    const link = `${feedUrl}/thoughts`;

    items.push(`
    <item>
      <title>Thought</title>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(link)}-${thought.id}</guid>
      <pubDate>${thoughtDate}</pubDate>
      <description>${escapeXml(thought.content.substring(0, 500))}${thought.content.length > 500 ? '...' : ''}</description>
    </item>`);
  }

  items.sort((a, b) => {
    const dateA = new Date(a.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || 0).getTime();
    const dateB = new Date(b.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || 0).getTime();
    return dateB - dateA;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(feedUrl)}</link>
    <description>${escapeXml(description)}</description>
    <language>en-us</language>
    <atom:link href="${escapeXml(`${feedUrl}/feed.xml`)}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>TinyMind</generator>${items.join('')}
  </channel>
</rss>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const username = params.username;
  const cacheKey = `rss:${username}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tinymind.me';

  try {
    const cached = rssCache.get(cacheKey);
    if (cached) {
      return new NextResponse(cached, {
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
    const octokit = githubToken
      ? new Octokit({ auth: githubToken })
      : new Octokit();

    const [blogPosts, thoughts] = await Promise.all([
      getBlogPostsPublicFast(octokit, username, 'tinymind-blog'),
      getThoughtsPublic(octokit, username, 'tinymind-blog'),
    ]);

    const rss = generateRssFeed(username, blogPosts, thoughts, baseUrl);

    rssCache.set(cacheKey, rss);

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating RSS feed:', error);
    }

    const cached = rssCache.get(cacheKey);
    if (cached) {
      return new NextResponse(cached, {
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    if (error && typeof error === 'object' && 'status' in error && error.status === 403) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', message: 'Too many requests to GitHub API' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate RSS feed' },
      { status: 500 }
    );
  }
}
