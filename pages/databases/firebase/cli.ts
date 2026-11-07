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

const { app, getSection } = getFirebase();

try {
  const { get } = getSection("antigravity_cli");

  const snapshot = await get("settings");

  console.log(snapshot);
} finally {
  await deleteApp(app);
}
