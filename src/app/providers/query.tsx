// src/app/providers/query.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";

export function QueryProvider({ children }: PropsWithChildren) {
  // SSR/CSR 모두 안전: 인스턴스 1회
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
