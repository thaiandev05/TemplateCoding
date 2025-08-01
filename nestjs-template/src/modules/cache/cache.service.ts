import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { Cache } from "cache-manager";

@Injectable()
export class CacheService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }

    async getOrSet<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
        // get cached by key
        const cached = await this.cacheManager.get<T>(key)
        if (cached) return cached // return cache when it available

        const fresh = await fetchFn() // fetch data
        await this.cacheManager.set(key, fresh) // set cache
        return fresh
    }
}