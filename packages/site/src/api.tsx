import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import React, { useState } from "react";
import { createTRPCReact } from "@trpc/react-query";
import type { Router } from "@paypals/functions/api";

const trpc = createTRPCReact<Router>();

export const api = trpc;

const API_URL = `${import.meta.env.VITE_API_URL}/trpc`;

export const ApiProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                loggerLink({
                    enabled: (op) =>
                        import.meta.env.VITE_IS_LOCAL === "true" ||
                        (op.direction === "down" && op.result instanceof Error),
                }),
                httpBatchLink({
                    url: API_URL,
                    // uncomment this to send cookies to the API
                    // fetch(url, options) {
                    //     return fetch(url, {
                    //         ...options,
                    //         credentials: "include",
                    //     });
                    // },
                }),
            ],
        }),
    );
    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </trpc.Provider>
    );
};
