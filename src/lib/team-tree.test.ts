import {describe,it,expect} from 'vitest';
import {teamTreeNodes} from './team-tree';
describe('All-level team tree',()=>{
  it('shows every referral level without a depth cap',()=>{
    const links=Array.from({length:60},(_,i)=>({referrer_id:String(i),referred_id:String(i+1)}));
    const nodes=teamTreeNodes(links,'0');
    expect(nodes).toHaveLength(61);
    expect(nodes.at(-1)).toEqual({id:'60',parentId:'59',level:60,rootId:'0'});
  });
  it('retains parent relationships and separates branches',()=>{
    expect(teamTreeNodes([{referrer_id:'a',referred_id:'b'},{referrer_id:'b',referred_id:'c'},{referrer_id:'x',referred_id:'y'}],'a').map(n=>[n.id,n.parentId,n.level])).toEqual([['a',null,0],['b','a',1],['c','b',2]]);
  });
  it('shows disconnected cycles once and ignores duplicate edges',()=>{
    const links=[{referrer_id:'a',referred_id:'b'},{referrer_id:'b',referred_id:'a'},{referrer_id:'a',referred_id:'b'}];
    expect(teamTreeNodes(links).map(n=>n.id)).toEqual(['a','b']);
  });
});