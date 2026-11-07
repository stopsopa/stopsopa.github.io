/**
~/Workspace/SPECIAL_web/SPECIAL_web szdz √ NODE_OPTIONS= node --env-file .env pages/databases/firebase/cli.ts
{
  current: 'eagereuler@gmail,com',
  models: [ 'Gemini 3.8 Flash', 'Claude Sonnet 4.6 (Thinking)' ],
  renewalHours: 168
}
~/Workspace/SPECIAL_web/SPECIAL_web szdz √ 
 */

import { getFirebase, deleteApp } from "./lib.ts";

const { app, db } = getFirebase();

try {
  const ref = db.ref("users/grytysek@gmail,com/antigravity_cli/settings");

  const snapshot = await ref.get();

  console.log(snapshot.val());
} finally {
  await deleteApp(app);
}
