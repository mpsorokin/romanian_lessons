import { useEffect, useState } from "react";
import { loadContentBody, type Content } from "../lib/content";

interface ContentBodyState {
  body: string | null;
  error: Error | null;
}

/** Loads a markdown body on demand; metadata alone is enough for every other screen. */
export function useContentBody(item: Content | undefined): ContentBodyState {
  const [state, setState] = useState<ContentBodyState>({ body: null, error: null });

  useEffect(() => {
    if (!item) {
      setState({ body: null, error: null });
      return;
    }

    let cancelled = false;
    setState({ body: null, error: null });

    loadContentBody(item).then(
      (body) => {
        if (!cancelled) setState({ body, error: null });
      },
      (error: unknown) => {
        if (!cancelled) setState({ body: null, error: error instanceof Error ? error : new Error(String(error)) });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [item]);

  return state;
}
