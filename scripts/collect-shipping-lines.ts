import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {parseAlphalinerText} from '../src/lib/shipping/parse';
const sourceUrl='https://alphaliner.axsmarine.com/PublicTop100/';
async function main(){
 const inputIndex=process.argv.indexOf('--input');let content:string;let method:'direct-http'|'web-search-index';
 if(inputIndex>=0){if(!process.argv[inputIndex+1])throw Error('Missing input path');content=readFileSync(process.argv[inputIndex+1],'utf8');method=content.includes('Retrieval: web search index')?'web-search-index':'direct-http';}
 else{const response=await fetch(sourceUrl,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(`Source returned ${response.status}`);content=await response.text();method='direct-http';}
 // Preserve table boundaries; unrelated percentages must not become capacity share.
 if(content.includes('<html'))content=content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<\/t[dh]>/gi,' | ').replace(/<\/tr>/gi,'\n').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&');
 const snapshot=parseAlphalinerText(content,{sourceUrl,retrievedAt:new Date().toISOString(),retrievalMethod:method});
 mkdirSync('data',{recursive:true});writeFileSync('data/shipping-lines.json',JSON.stringify(snapshot,null,2)+'\n');console.log(`Validated ${snapshot.entries.length} carriers · ${snapshot.asOf} · ${method}`);
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Source extraction failed');process.exitCode=1});
