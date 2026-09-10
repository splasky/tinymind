"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { markdownComponents } from "@/components/shared/markdownComponents";
import { remarkVideoEmbeds } from "@/lib/videoEmbeds";
import "katex/dist/katex.min.css";

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex];

/**
 * The math-capable renderer. Kept in its own module so that KaTeX and its
 * stylesheet land in a chunk that only loads for content containing math.
 */
export default function MathMarkdown({
  content,
  className,
  enableVideoEmbeds = false,
}: {
  content: string;
  className?: string;
  enableVideoEmbeds?: boolean;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={enableVideoEmbeds ? [...remarkPlugins, remarkVideoEmbeds] : remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={markdownComponents}
      className={className}
    >
      {content}
    </ReactMarkdown>
  );
}
