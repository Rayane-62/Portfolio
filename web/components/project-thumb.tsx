"use client";

import { useEffect, useRef, useState } from "react";

/** Initiales du titre, affichées quand le projet n'a pas (ou plus) d'image. */
function glyph(title: string) {
  return (
    title
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "··"
  );
}

export function ProjectThumb({
  title,
  imageUrl,
}: {
  title: string;
  imageUrl: string | null;
}) {
  const [failed, setFailed] = useState(!imageUrl);
  const ref = useRef<HTMLImageElement | null>(null);

  /* L'image peut échouer avant l'hydratation : on relit son état au montage. */
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <div className="thumb">
      {failed || !imageUrl ? (
        <span className="glyph" aria-hidden="true">
          {glyph(title)}
        </span>
      ) : (
        // image servie par l'API (URL absolue)
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={imageUrl}
          alt={title}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
