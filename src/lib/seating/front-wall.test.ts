import { beforeEach, expect, it, vi } from "vitest";
import type { ClassroomLayout, FrontWall } from "@/lib/types/layout";
import type { Student } from "@/lib/types/student";
import { isFrontOfRoom } from "./geometry";
import { scoreConstraintsFit } from "./scoring";
import { finalAccommodationIssues } from "./final-accommodation-audit";
import { generateSeating } from "./generate";
import { rowToLayout } from "@/lib/layouts/db";
import { updateLayout } from "@/lib/layouts/actions";
import * as db from "@/lib/local/store";
import { loadSampleData } from "@/lib/local/sample";
vi.mock("@/lib/local/nav", () => ({go:vi.fn(),withMessage:(p:string)=>p}));
const layout:ClassroomLayout={id:'test',userId:'local',name:'Room',type:'traditional',rows:3,columns:3,numGroups:null,studentsPerGroup:null,grid:[['perimeter','perimeter','perimeter','perimeter','perimeter'],['perimeter','seat','seat','seat','perimeter'],['perimeter','seat','seat','seat','perimeter'],['perimeter','seat','seat','seat','perimeter'],['perimeter','perimeter','perimeter','perimeter','perimeter']],createdAt:'x',updatedAt:'x'};
const student:Student={id:'synthetic',userId:'local',name:'Synthetic',allergies:[],healthFlags:[],prosocialTraits:[],antisocialTraits:[],constraints:['front_of_room','vision_front'],togetherIds:[],separateIds:[],notes:null,createdAt:'x',updatedAt:'x'};
const options={honorDietaryAccessibility:true,respectMustSitTogether:true,respectStrictlySeparate:true,spreadAntisocialTraits:true};
it.each<[FrontWall,number,number]>([['top',1,2],['right',2,3],['bottom',3,2],['left',2,1]])('uses %s consistently in scoring, final audit and generation',(frontWall,row,column)=>{
 const room={...layout,frontWall};
 expect(isFrontOfRoom({row,column},room)).toBe(true);
 expect(isFrontOfRoom({row:2,column:2},room)).toBe(false);
 expect(scoreConstraintsFit(student,room,{row,column}).explanations.every(e=>e.weight>0)).toBe(true);
 expect(finalAccommodationIssues([student],room,{[`${row},${column}`]:student.id},true)).toEqual([]);
 expect(finalAccommodationIssues([student],room,{'2,2':student.id},true)).toHaveLength(2);
 const result=generateSeating([student],room,options);
 const seat=Object.keys(result.assignments)[0].split(',').map(Number);
 expect(isFrontOfRoom({row:seat[0],column:seat[1]},room)).toBe(true);
});
it('does not infer orientation from a whiteboard and warns for legacy rooms',()=>{
 const room={...layout,grid:layout.grid.map(row=>[...row])};room.grid[2][4]='whiteboard';
 expect(isFrontOfRoom({row:1,column:2},room)).toBe(true);
 expect(generateSeating([student],room,options).issues.some(i=>i.message.includes('unconfirmed'))).toBe(true);
});
it('uses nearest occupied seating band when there is a front aisle',()=>{
 const room={...layout,frontWall:'top' as const,grid:layout.grid.map(row=>[...row])};room.grid[1]=['perimeter','empty','empty','empty','perimeter'];
 expect(isFrontOfRoom({row:2,column:2},room)).toBe(true);
 expect(isFrontOfRoom({row:3,column:2},room)).toBe(false);
});
beforeEach(()=>{localStorage.clear();db.__resetForTests();});
it('persists explicit choice, marks charts stale, and round-trips backup',async()=>{
 const {layoutId,classId}=loadSampleData();const old=db.find('layouts',layoutId)!;
 expect(rowToLayout(old).frontWall).toBeNull();
 const [chart]=db.insert('seating_charts',[{user_id:db.LOCAL_USER_ID,name:'Synthetic chart',layout_id:layoutId,cohort_id:classId,assignments:{},locked_seats:{},score:100,seed:0,stale:false,stale_reasons:[]}]);
 const form=new FormData();for(const [key,value] of Object.entries({name:old.name,type:old.type,rows:old.rows,columns:old.columns,grid:JSON.stringify(old.grid),frontWall:'right'}))form.set(key,String(value));
 await updateLayout(layoutId,form);
 expect(db.find('layouts',layoutId)?.front_wall).toBe('right');expect(db.find('seating_charts',chart.id)?.stale).toBe(true);
 const backup=db.createBackup();expect(db.parseBackup(JSON.stringify(backup)).layouts[0].front_wall).toBe('right');
 db.__resetForTests();expect(rowToLayout(db.find('layouts',layoutId)!).frontWall).toBe('right');
});
it('accepts old backup without front wall and rejects invalid wall without changes',()=>{
 loadSampleData();const backup=db.createBackup();expect(rowToLayout(db.parseBackup(JSON.stringify(backup)).layouts[0]).frontWall).toBeNull();
 const malformed=JSON.parse(JSON.stringify(backup));malformed.data.layouts[0].front_wall='ceiling';const before=JSON.stringify(db.getSnapshot());
 expect(()=>db.parseBackup(JSON.stringify(malformed))).toThrow();expect(JSON.stringify(db.getSnapshot())).toBe(before);
});
