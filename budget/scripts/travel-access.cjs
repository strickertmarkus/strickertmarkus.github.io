/* Provision the two family planning branches with the existing authenticated recipe policy.
   No family records, emails, rules expressions or credentials are logged. */
'use strict';
const admin=require('firebase-admin'),{isDeepStrictEqual}=require('node:util'),{randomUUID}=require('node:crypto');
const databaseURL='https://frick-budget-default-rtdb.europe-west1.firebasedatabase.app';
const roots=['family_travel_v1','family_todos_v2'];
(async()=>{
 if(!process.env.FIREBASE_SERVICE_ACCOUNT_JSON)throw Error('Firebase credential is unavailable; family planning access could not be verified.');
 const credential=admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
 const app=admin.initializeApp({credential,databaseURL},'travel-access');
 const apps=[app];
 try{
  const db=app.database(),before=await db.getRulesJSON();
  const authenticated=p=>p&&typeof p['.read']==='string'&&typeof p['.write']==='string'&&p['.read'].includes('auth')&&p['.write'].includes('auth');
  const reference=[before.rules?.family_todos_v2,before.rules?.sh_recipes_v3].find(authenticated);
  if(!reference)throw Error('No existing authenticated family policy found. Access was left unchanged.');
  const missing=roots.filter(root=>!before.rules[root]);
  if(missing.length){
   const latest=await db.getRulesJSON();if(!isDeepStrictEqual(latest,before))throw Error('Rules changed concurrently. Retry the workflow.');
   const next=structuredClone(before);for(const root of missing)next.rules[root]={'.read':reference['.read'],'.write':reference['.write']};await db.setRules(next);
   const after=await db.getRulesJSON(),unchanged=structuredClone(after);for(const root of missing)delete unchanged.rules[root];
   if(!isDeepStrictEqual(unchanged,before))throw Error('Unexpected rules change detected. Review database access.');
   console.log('Installed authenticated access for '+missing.join(', ')+'; existing branches unchanged.');
  }
  const policy=await db.getRulesJSON();for(const root of roots)if(!policy.rules[root]?.['.read']||!policy.rules[root]?.['.write'])throw Error('Family planning policy is incomplete. Existing policy preserved.');
  // The existing recipe policy permits authenticated sessions. Enforce the rules,
  // rather than using the Admin bypass, against unique nonexistent paths only.
  const limited=admin.initializeApp({credential,databaseURL,databaseAuthVariableOverride:{uid:'family-planning-permission-probe'}},'travel-rules-probe');apps.push(limited);
  for(const root of roots){const ref=limited.database().ref(root+'/_permission_probe_'+randomUUID());await ref.once('value');await ref.set(null);}
  console.log('Authenticated read/write probes passed for travel and shared tasks; no sample records created.');
 }finally{await Promise.all(apps.map(a=>a.delete()));}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
