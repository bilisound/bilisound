import { BilisoundSDKDirect } from "@bilisound/sdk";
import { USER_AGENT } from "../constants/values";

interface Endpoint {
    siteUrl: string;
    apiUrl: string;
    key: string;
}

export function getSDK(env: any) {
    const endpoints: Endpoint[] = env.ENDPOINT_BILI;
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const cache = env.bilisound as KVNamespace;

    return new BilisoundSDKDirect({
        sitePrefix: endpoint.siteUrl,
        apiPrefix: endpoint.apiUrl,
        key: endpoint.key,
        userAgent: USER_AGENT,
        cacheProvider: {
            get(key: string): Promise<string | null | undefined> {
                return cache.get(key);
            },
            set(key: string, value: string): Promise<void> {
                return cache.put(key, value, { expirationTtl: 3600 });
            },
            delete(key: string): Promise<void> {
                return cache.delete(key);
            },
        },
    });
}
