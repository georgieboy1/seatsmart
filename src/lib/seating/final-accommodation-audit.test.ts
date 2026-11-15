import {expect,it} from 'vitest';
import type {Student} from '@/lib/types/student';
import type {ClassroomLayout} from '@/lib/types/layout';
import {finalAccommodationIssues} from './final-accommodation-audit';
import {scoreConstraintsFit} from './scoring';
import {generateSeating} from './generate';
const student:Student={id:'synthetic',userId:'local',name:'Synthetic Student',allergies:[],healthFlags:[],prosocialTraits:[],antisocialTraits:[],constraints:['front_of_room','hearing_left','near_door'],togetherIds:[],separateIds:[],notes:null,createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'};
const layout:ClassroomLayout={id:'synthetic-room',userId:'local',name:'Test room',type:'traditional',rows:null,columns:null,numGroups:null,studentsPerGroup:null,grid:[['seat','seat','seat'],['seat','seat','seat'],['seat','door','seat']],createdAt:student.createdAt,updatedAt:student.updatedAt};
it('reports individual unmet rule even when total fit is positive',()=>{
 expect(scoreConstraintsFit(student,layout,{row:2,column:0}).score).toBeGreaterThan(0);
 const issues=finalAccommodationIssues([student],layout,{'2,0':student.id},true);
 expect(issues).toHaveLength(1);expect(issues[0].message).toContain('front of room');
});
it('warns for an unmet locked placement without moving it',()=>{
 const result=generateSeating([student],layout,{honorDietaryAccessibility:true,respectMustSitTogether:true,respectStrictlySeparate:true,spreadAntisocialTraits:true,lockedSeats:{'2,0':student.id}});
 expect(result.assignments['2,0']).toBe(student.id);
 expect(result.issues.some(issue=>issue.message.includes('Final placement needs review'))).toBe(true);
 expect(result.score).toBeLessThan(100);
});
it('does not claim to assess disabled accommodations',()=>expect(finalAccommodationIssues([student],layout,{'2,0':student.id},false)).toEqual([]));
it('reports missing room feature',()=>expect(finalAccommodationIssues([{...student,constraints:['near_charging']}],layout,{'0,0':student.id},true)[0].message).toContain('No charging station'));
it('reports no issue when every evaluated rule fits',()=>expect(finalAccommodationIssues([student],layout,{'1,0':student.id},true)).toEqual([]));
it('skips unknown students or non-seat cells without throwing',()=>expect(finalAccommodationIssues([student],layout,{'2,1':student.id,'bad':'missing'},true)).toEqual([]));
it('positive peer preferences cannot restore a perfect score over an unmet accommodation',()=>{
 const peer={...student,id:'synthetic-peer',name:'Synthetic Peer',constraints:[],togetherIds:[student.id]};
 const first={...student,togetherIds:[peer.id]};
 const result=generateSeating([first,peer],layout,{honorDietaryAccessibility:true,respectMustSitTogether:true,respectStrictlySeparate:true,spreadAntisocialTraits:true,lockedSeats:{'2,0':first.id,'1,0':peer.id}});
 expect(result.issues.some(issue=>issue.externalIds?.includes(first.id))).toBe(true);
 expect(result.score).toBeLessThan(100);
});
it('every negative placement explanation has a report warning',()=>{
 const peer={...student,id:'synthetic-peer',name:'Synthetic Peer',constraints:[],separateIds:[student.id]};
 const first={...student,separateIds:[peer.id]};
 const result=generateSeating([first,peer],layout,{honorDietaryAccessibility:true,respectMustSitTogether:true,respectStrictlySeparate:true,spreadAntisocialTraits:true,lockedSeats:{'2,0':first.id,'1,0':peer.id}});
 for(const [seat,items] of Object.entries(result.explanationsBySeat)) {
  for(const item of items.filter(x=>x.weight<0)) expect(result.issues.some(issue=>issue.externalIds?.includes(result.assignments[seat])&&issue.message.includes(item.reason))).toBe(true);
 }
 expect(result.score).toBeLessThan(100);
});
