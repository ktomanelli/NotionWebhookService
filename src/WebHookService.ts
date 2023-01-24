import { NotionService } from "./NotionService";
import { RedisService } from "./RedisService";
import axios from 'axios';
import moment, { Moment } from "moment";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { notionUserId } from "./config";

export class WebHookService {
    private redisService: RedisService
    private notionService: NotionService
    constructor(redis:RedisService, notion:NotionService){
        this.redisService = redis;
        this.notionService = notion
    }
    
    public async PollForChanges(){
        const pagesObj = await this.notionService.getPagesObj() as any;
        const cacheResult = await this.redisService.getAll(notionUserId)
        const cacheArray:string[] = Object.values(cacheResult);
        if(cacheArray.length){
            for(const cachedPageString of cacheArray){
                const cachedPage:PageObjectResponse = JSON.parse(cachedPageString);
                const page = pagesObj[cachedPage.id];
                if(page){
                    const cacheLastEdit = moment(cachedPage.last_edited_time);
                    const pageLastEdit = moment(page.last_edited_time);
                    if(pageLastEdit.isAfter(cacheLastEdit)){
                        console.log('updating entry')
                        //update obj with current
                        await this.redisService.set(notionUserId, page.id, JSON.stringify(page))
                        //send UPDATED webhook
                        console.log('page updated')
                        axios.put('http://localhost:3000/notion', page)
                    }
                }else{
                    //page was deleted
                    this.redisService.del(notionUserId, cachedPage.id)
                    //send CREATED webhook
                    console.log('page deleted')
                    axios.delete('http://localhost:3000/notion', page)
                }
                delete pagesObj[cachedPage.id];
            }
            const createdPages = Object.values(pagesObj) as PageObjectResponse[];
            if(createdPages.length){
                //pages that were created
                for(const page of createdPages){
                    await this.redisService.set(notionUserId, page.id, JSON.stringify(page))
                    //send CREATED webhook
                    console.log('page created')
                    axios.post('http://localhost:3000/notion', page)
                }
            }
        }else{
            console.log('building cache')
            for(const page of Object.values(pagesObj)){
                await this.redisService.set(notionUserId, (page as PageObjectResponse).id, JSON.stringify(page))
            }
        }
    }
}
