"use client";

import { useState } from "react";
import type { VideoEmbedKind } from "@/lib/videoEmbeds";

interface VideoEmbedProps {
  "data-video-kind"?: VideoEmbedKind;
  "data-original-url"?: string;
  "data-embed-url"?: string;
  "data-label"?: string;
}

export function VideoEmbed(props: VideoEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const kind = props["data-video-kind"];
  const originalUrl = props["data-original-url"];
  const embedUrl = props["data-embed-url"];
  const label = props["data-label"] || "Video";

  if (!kind || !originalUrl || !embedUrl) return null;

  if (!loaded || failed) {
    return (
      <div className="not-prose my-6 flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
        {failed && <span className="text-sm text-red-600">This video could not be loaded.</span>}
        <div className="flex flex-wrap justify-center gap-3">
          {!failed && (
            <button
              type="button"
              onClick={() => setLoaded(true)}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            >
              Load video
            </button>
          )}
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 no-underline hover:bg-white dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Open original
          </a>
        </div>
      </div>
    );
  }

  if (kind === "ipfs") {
    return (
      <div className="not-prose my-6 overflow-hidden rounded-lg bg-black">
        <video
          src={embedUrl}
          controls
          preload="metadata"
          className="aspect-video w-full"
          onError={() => setFailed(true)}
        >
          <a href={originalUrl}>Open the video</a>
        </video>
      </div>
    );
  }

  return (
    <div className="not-prose my-6 aspect-video overflow-hidden rounded-lg bg-black">
      <iframe
        src={embedUrl}
        title={label}
        className="h-full w-full border-0"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
