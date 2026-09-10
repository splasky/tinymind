import type { Root } from "mdast";

export type VideoEmbedKind = "youtube" | "gdrive" | "ipfs";

export interface VideoEmbedData {
  kind: VideoEmbedKind;
  originalUrl: string;
  embedUrl: string;
  label: string;
}

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);
const IPFS_GATEWAY_HOSTS = new Set([
  "ipfs.io",
  "dweb.link",
  "cloudflare-ipfs.com",
  "gateway.pinata.cloud",
]);
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const DRIVE_ID = /^[A-Za-z0-9_-]{10,}$/;
const CID = /^[A-Za-z0-9]{32,}$/;

function parseYouTube(url: URL, originalUrl: string): VideoEmbedData | null {
  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  let id: string | null = null;
  if (url.hostname.toLowerCase() === "youtu.be") {
    id = parts[0] ?? null;
  } else if (parts[0] === "shorts" || parts[0] === "embed") {
    id = parts[1] ?? null;
  } else if (url.pathname === "/watch") {
    id = url.searchParams.get("v");
  }

  if (!id || !YOUTUBE_ID.test(id)) return null;
  return {
    kind: "youtube",
    originalUrl,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    label: `YouTube video ${id}`,
  };
}

function parseGoogleDrive(url: URL, originalUrl: string): VideoEmbedData | null {
  if (url.hostname.toLowerCase() !== "drive.google.com") return null;
  const match = url.pathname.match(/^\/file\/d\/([^/]+)/);
  const id = match?.[1];
  if (!id || !DRIVE_ID.test(id)) return null;
  return {
    kind: "gdrive",
    originalUrl,
    embedUrl: `https://drive.google.com/file/d/${id}/preview`,
    label: "Google Drive video",
  };
}

function ipfsData(cid: string, path: string, originalUrl: string): VideoEmbedData | null {
  if (!CID.test(cid)) return null;
  let suffix = "";
  if (path) {
    try {
      suffix = `/${path
        .split("/")
        .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
        .join("/")}`;
    } catch {
      return null;
    }
  }
  return {
    kind: "ipfs",
    originalUrl,
    embedUrl: `https://ipfs.io/ipfs/${cid}${suffix}`,
    label: `IPFS video ${cid.slice(0, 12)}…`,
  };
}

export function parseVideoEmbed(value: string): VideoEmbedData | null {
  const originalUrl = value.trim();
  let url: URL;
  try {
    url = new URL(originalUrl);
  } catch {
    return null;
  }

  if (url.protocol === "ipfs:") {
    return ipfsData(url.hostname, url.pathname.replace(/^\//, ""), originalUrl);
  }
  if (url.protocol !== "https:") return null;

  const youtube = parseYouTube(url, originalUrl);
  if (youtube) return youtube;
  const drive = parseGoogleDrive(url, originalUrl);
  if (drive) return drive;

  if (IPFS_GATEWAY_HOSTS.has(url.hostname.toLowerCase())) {
    const match = url.pathname.match(/^\/ipfs\/([^/]+)(?:\/(.*))?$/);
    if (match) return ipfsData(match[1], match[2] ?? "", originalUrl);
  }
  return null;
}

type MarkdownNode = {
  type: string;
  value?: string;
  url?: string;
  children?: MarkdownNode[];
  data?: {
    hName?: string;
    hProperties?: Record<string, string>;
  };
};

function paragraphUrl(node: MarkdownNode): string | null {
  if (node.type !== "paragraph" || node.children?.length !== 1) return null;
  const child = node.children[0];
  if (child.type === "link" && child.url) return child.url;
  if (child.type === "text" && child.value) return child.value.trim();
  return null;
}

/** Turn a paragraph containing only one supported video URL into a safe custom element. */
export function remarkVideoEmbeds() {
  return (tree: Root) => {
    const root = tree as unknown as MarkdownNode;
    for (const node of root.children ?? []) {
      const url = paragraphUrl(node);
      const video = url ? parseVideoEmbed(url) : null;
      if (!video) continue;
      node.data = {
        hName: "video-embed",
        hProperties: {
          "data-video-kind": video.kind,
          "data-original-url": video.originalUrl,
          "data-embed-url": video.embedUrl,
          "data-label": video.label,
        },
      };
    }
  };
}
