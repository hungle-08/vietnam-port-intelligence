import {it,expect} from 'vitest';
import {parseWikidataEntity} from '../src/lib/cdn/wikidata';
it('finds matching IMO with or without DWT and excludes other names',()=>{
 const entity={id:'Q123',labels:{en:{value:'HAIAN BETA'}},claims:{P458:[{mainsnak:{datavalue:{value:'1234567'}}}],P4519:[{mainsnak:{datavalue:{value:{amount:'+12000',unit:'http://www.wikidata.org/entity/Q191118'}}}}]}};
 expect(parseWikidataEntity('HAIAN BETA',entity)).toMatchObject({imo:'1234567',dwt:12000,name:'HAIAN BETA',sourceUrl:'https://www.wikidata.org/wiki/Q123'});
 expect(parseWikidataEntity('OTHER SHIP',entity)).toBeNull();
 expect(parseWikidataEntity('HAIAN BETA',{...entity,claims:{P458:entity.claims.P458}})).toMatchObject({imo:'1234567',dwt:null});
});
