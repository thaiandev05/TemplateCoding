import { Injectable } from "@nestjs/common";
import Redis from 'ioredis';

const TIME_LIFE_VALUE = 60 * 60

@Injectable()
export class TicketService {

    // create default redis
    private redis = new Redis()

    // key follow status user
    private onlineKey = (userId: string) => `user:${userId}:status`
    private lastSeenKey = (userId: string) => `user:${userId}:lastSeen`

    async setUserOnline(userId: string) {
        await this.redis.set(this.onlineKey(userId), 'online', 'EX', TIME_LIFE_VALUE)
        await this.redis.set(this.lastSeenKey(userId), new Date().toISOString())
    }

    async setUserOffline(userId: string) {
        await this.redis.set(this.onlineKey(userId), 'offline')
        await this.redis.set(this.lastSeenKey(userId), new Date().toISOString())
    }

    // check status user
    async isUserOnline(userId: string): Promise<boolean> {
        const status = await this.redis.get(this.onlineKey(userId));
        return status === 'online';
    }

    // get time behavior before online or offline
    async getLastSeen(userId: string): Promise<string | null> {
        return await this.redis.get(this.lastSeenKey(userId));
    }

}