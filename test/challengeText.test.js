import test from 'node:test';
import assert from 'node:assert/strict';
import {challengeText} from '../src/challengeText.js';
import {weapons, mastery, initial, model} from '../src/model.js';
test('format repeated objectives naturally, without changing ordinary counters',()=>{
 assert.equal(challengeText(5,'2 player kills within 10 seconds (repetitions)'),'2 player kills within 10 seconds - 5 times');
 assert.equal(challengeText(1,'3 kills without dying (repetitions)'),'3 kills without dying - 1 time');
 assert.equal(challengeText(25,'headshots'),'25 headshots');
 assert.equal(challengeText(150,'Reach Prestige Master level'),'Reach Prestige Master level 150');
 assert.equal(challengeText(null,'unknown'),'Target not verified');
});
test('every weapon and mastery repetition uses the suffix format',()=>{
 const m=model(initial(),2);let count=0;
 for(const a of [...weapons.flatMap(w=>w.rows.flatMap(r=>[0,1,2].map(mode=>m.info(w.id,r,mode)))),...mastery]){
  if(a.target!=null && /\(repetitions\)$/i.test(a.desc)){assert.equal(challengeText(a.target,a.desc),`${a.desc.replace(/\s*\(repetitions\)$/i,'')} - ${a.target} ${a.target===1?'time':'times'}`);count++;}
 }assert.ok(count>0);
});
