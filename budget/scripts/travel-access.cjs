/* Provision only the travel branch with the existing family-task access policy.
   No family records, emails, rules expressions or credentials are logged. */
'use strict';
const admin=require('firebase-admin'),{isDeepStrictEqual}=require('node:util');
const databaseURL='https://frick-budget-default-rtdb.europe-west1.firebasedatabase.app';
(async()=>{
 if(!process.env.FIREBASE_SERVICE_ACCOUNT_JSON)throw Error('Firebase credential is unavailable; travel sync access could not be verified.');
 const app=admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),databaseURL},'travel-access');
 try{
  const db=app.database(),before=await db.getRulesJSON(),reference=before.rules?.family_todos_v2;
  if(!reference||typeof reference['.read']!=='string'||typeof reference['.write']!=='string'||!reference['.read'].includes('auth')||!reference['.write'].includes('auth'))throw Error('No explicit authenticated family-task policy found. Existing access was left unchanged.');
  if(!before.rules.family_travel_v1){
   // Read twice immediately before mutation; do not overwrite a concurrently edited policy.
   const latest=await db.getRulesJSON();if(!isDeepStrictEqual(latest,before))throw Error('Rules changed concurrently. Retry the workflow.');
   const next=structuredClone(before);next.rules.family_travel_v1={'.read':reference['.read'],'.write':reference['.write']};await db.setRules(next);
   const after=await db.getRulesJSON(),withoutTravel=structuredClone(after);delete withoutTravel.rules.family_travel_v1;
   if(!isDeepStrictEqual(withoutTravel,before))throw Error('Unexpected rules change detected. Review database access before proceeding.');
   console.log('Created travel access using the existing authenticated family-task policy; all other branches unchanged.');
  }else{
   const travel=before.rules.family_travel_v1;
   if(!travel['.read']||!travel['.write'])throw Error('Travel access exists but is incomplete. Existing policy was not overwritten.');
   console.log('Travel branch already has read/write access rules; existing policy preserved.');
  }
 }finally{await app.delete();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
