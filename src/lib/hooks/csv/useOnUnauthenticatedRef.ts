import { useEffect, useRef } from "react";

type UnauthenticatedHandler = (() => void) | undefined;

export function useOnUnauthenticatedRef(handler?: () => void) {
  const ref = useRef<UnauthenticatedHandler>(handler);

  useEffect(() => {
    ref.current = handler;
  }, [handler]);

  return ref;
}

