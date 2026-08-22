import { COLLEGES } from '../data/colleges';
export function getColleges(){ return COLLEGES; }
export function getCollegeById(id){ return COLLEGES.find(c=>c.id===id) || null; }
export function getCollegeBranch(collegeId, branchName){
  const college=getCollegeById(collegeId); return college?.branches.find(b=>b.name===branchName) || null;
}
