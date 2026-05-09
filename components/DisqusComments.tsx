"use client";

import React, { useEffect, useRef } from "react";

interface DisqusCommentsProps {
  shortname: string;
  url: string;
  identifier: string;
  title: string;
}

export default function DisqusComments({
  shortname,
  url,
  identifier,
  title,
}: DisqusCommentsProps) {
  const disqusRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!shortname || loadedRef.current) return;

    const disqusContainer = disqusRef.current;
    if (!disqusContainer) return;

    const loadDisqus = () => {
      if ((window as any).DISQUS) {
        (window as any).DISQUS.reset({
          reload: true,
          config: () => {
            (window as any).this.page.url = url;
            (window as any).this.page.identifier = identifier;
            (window as any).this.page.title = title;
          },
        });
        return;
      }

      const d = document;
      const s = d.createElement("script");
      s.src = `https://${shortname}.disqus.com/embed.js`;
      s.setAttribute("data-timestamp", Date.now().toString());
      s.onload = () => {
        if ((window as any).DISQUS) {
          (window as any).DISQUS.reset({
            reload: true,
            config: () => {
              (window as any).this.page.url = url;
              (window as any).this.page.identifier = identifier;
              (window as any).this.page.title = title;
            },
          });
        }
      };
      (d.head || d.body).appendChild(s);
      loadedRef.current = true;
    };

    loadDisqus();
  }, [shortname, url, identifier, title]);

  return (
    <div className="max-w-3xl mx-auto mt-8 mb-8">
      <div ref={disqusRef} id="disqus_thread" />
    </div>
  );
}
