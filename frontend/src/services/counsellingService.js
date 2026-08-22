export const SAMPLE_EVENTS=[
 {name:'Registration Opens',date:'15 Jun 2026',status:'done'},
 {name:'Registration Closes',date:'30 Jun 2026',status:'done'},
 {name:'Choice Filling Window',date:'05–12 Jul 2026',status:'now'},
 {name:'Choice Locking',date:'12 Jul 2026',status:'upcoming'},
 {name:'Round 1 Seat Allotment',date:'18 Jul 2026',status:'upcoming'},
 {name:'Document Verification',date:'20–22 Jul 2026',status:'upcoming'},
 {name:'Round 2 Seat Allotment',date:'27 Jul 2026',status:'upcoming'},
 {name:'Reporting / Final Admission',date:'10 Aug 2026',status:'upcoming'}
];
export function getDocuments(profile,examName){
 return ['Class 10 Certificate & Marksheet','Class 12 Certificate & Marksheet',`${examName} Rank / Score Card`,profile.category!=='General'?`${profile.category} Category Certificate`:null,'Domicile / Residence Certificate','Income Certificate (if applicable)','Government ID Proof (Aadhaar/Passport)','Passport-size Photographs (multiple)','Medical Fitness Certificate (where required)'].filter(Boolean);
}
