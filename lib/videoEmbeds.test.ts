import { describe, expect, it } from "vitest";
import { parseVideoEmbed, remarkVideoEmbeds } from "./videoEmbeds";

describe("parseVideoEmbed", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
  ])("normalizes YouTube URL %s", (input, expected) => {
    expect(parseVideoEmbed(input)?.embedUrl).toBe(expected);
  });

  it("normalizes a Google Drive file URL", () => {
    expect(parseVideoEmbed("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view")?.embedUrl)
      .toBe("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/preview");
  });

  it("normalizes ipfs URLs without losing path segments", () => {
    expect(parseVideoEmbed("ipfs://bafybeigdyrztabcdefghijklmnopqrstuvwx/video file.mp4")?.embedUrl)
      .toBe("https://ipfs.io/ipfs/bafybeigdyrztabcdefghijklmnopqrstuvwx/video%20file.mp4");
  });

  it("accepts allowlisted IPFS gateways", () => {
    expect(parseVideoEmbed("https://dweb.link/ipfs/bafybeigdyrztabcdefghijklmnopqrstuvwx/video.mp4")?.kind)
      .toBe("ipfs");
  });

  it.each([
    "javascript:alert(1)",
    "http://youtu.be/dQw4w9WgXcQ",
    "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
    "https://drive.google.com.evil.test/file/d/1AbCdEfGhIjKlMnOp/view",
    "https://example.com/ipfs/bafybeigdyrztabcdefghijklmnopqrstuvwx/video.mp4",
    "https://youtu.be/not-valid",
  ])("rejects unsupported or unsafe URL %s", (input) => {
    expect(parseVideoEmbed(input)).toBeNull();
  });
});

describe("remarkVideoEmbeds", () => {
  it("marks a paragraph containing only a supported link", () => {
    const paragraph = {
      type: "paragraph",
      children: [{ type: "link", url: "https://youtu.be/dQw4w9WgXcQ", children: [] }],
    };
    const tree = { type: "root", children: [paragraph] };

    remarkVideoEmbeds()(tree as never);

    expect(paragraph).toHaveProperty("data.hName", "video-embed");
    expect(paragraph).toHaveProperty("data.hProperties.data-video-kind", "youtube");
  });

  it("does not mark a paragraph with surrounding text", () => {
    const paragraph = {
      type: "paragraph",
      children: [
        { type: "text", value: "Watch " },
        { type: "link", url: "https://youtu.be/dQw4w9WgXcQ", children: [] },
      ],
    };
    const tree = { type: "root", children: [paragraph] };

    remarkVideoEmbeds()(tree as never);

    expect(paragraph).not.toHaveProperty("data");
  });
});
