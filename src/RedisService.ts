import { createClient } from "redis";
export class RedisService{
    private client:any;
    public async init(){
        const redisClient = createClient();
        redisClient.on("error", (error) => console.error(`Error : ${error}`));
        this.client = redisClient;
        await redisClient.connect();
        redisClient.flushAll();
    }

    public async getAll(key:string){
        return this.client.hGetAll(key);
    }
    public async set(key:string, field:string, value:string){
        return this.client.hSet(key, field, value);
    }
    public async del(key:string, field:string){
        return this.client.del(key, field)
    }
    public disconnect(){
        return this.client.disconnect();
    }
}