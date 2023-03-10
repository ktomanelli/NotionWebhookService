import { Client as NotionClient} from "@notionhq/client";
import { DatabaseObjectResponse, PartialDatabaseObjectResponse, PartialPageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
type QueryType = 'database' | 'page'

type GetItemsInput = {
    query?:string,
    queryType: QueryType,
    startCursor?:string
}
export class NotionService{
    private notion: NotionClient;
    constructor(notionClient: NotionClient){
        this.notion = notionClient;
    }

    public async getDataBase(databaseId: string):Promise<PartialDatabaseObjectResponse>{
        return this.notion.databases.retrieve({database_id:databaseId});
    }
    public async getDatabases(): Promise<(PartialPageObjectResponse | PartialDatabaseObjectResponse)[]> {
        return this.getItems({queryType:'database'})
    }
    
    public async getPages(): Promise<(PartialPageObjectResponse | PartialDatabaseObjectResponse)[]> {
        return this.getItems({queryType:'page'});
    }

    public async getPagesObj(){
        const pages = await this.getPages();
        return pages.reduce((a,v)=>({...a,[v.id]:v}),{})
    }
    
    private async getItems(options: GetItemsInput): Promise<(PartialPageObjectResponse | PartialDatabaseObjectResponse)[]> {
        const items = [];
        const resp = await this.searchNotion(options)
        items.push(...resp.results)
        if(resp.has_more){
            items.push(...await this.getItems({...options, startCursor: resp.next_cursor as string}))   
        }
        return items;
    }
    
    private async searchNotion(options: GetItemsInput) {
        const {query, startCursor, queryType} = options;
        try{
            const databaseListResp = await this.notion.search({
                query,
                start_cursor: startCursor || undefined,
                filter:{
                    value: queryType,
                    property: "object",
                }
            });
            return databaseListResp;
        }catch(e: any){
            throw new Error(`Error in Notion Search. ${e.status}: ${e.message}`)
        }
    }
}