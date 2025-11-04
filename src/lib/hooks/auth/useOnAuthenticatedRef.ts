import { useEffect, useRef } from "react";

type AuthenticatedHandler = (() => void) | undefined;

export function useOnAuthenticatedRef(handler?: () => void) {
  const ref = useRef<AuthenticatedHandler>(handler);

  useEffect(() => {
    ref.current = handler;
  }, [handler]);

  return ref;
}

