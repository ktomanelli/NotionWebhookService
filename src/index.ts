import { Client } from '@notionhq/client';
import { notionKey } from './config';
import { createClient } from 'redis';
import { NotionService } from './NotionService';
import { RedisService } from './RedisService';
import { WebHookService } from './WebHookService';

const notionClient = new Client({auth: notionKey});
const notionService = new NotionService(notionClient);
const redisService = new RedisService();
const webHookService = new WebHookService(redisService, notionService);

const initialize = async () => {
    await redisService.init();
}


initialize();
setInterval(async ()=>{
    try{
        await webHookService.PollForChanges();
    }catch(e){
        console.log(e);
    }
},10000)
