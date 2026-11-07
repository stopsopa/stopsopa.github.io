/**
~/Workspace/SPECIAL_web/SPECIAL_web szdz √ NODE_OPTIONS= node --env-file .env pages/databases/firebase/cli.ts
{
  current: 'eagereuler@gmail,com',
  models: [ 'Gemini 3.8 Flash', 'Claude Sonnet 4.6 (Thinking)' ],
  renewalHours: 168
}
~/Workspace/SPECIAL_web/SPECIAL_web szdz √ 
 */

import { initializeApp, getApps, type Credential, type GoogleOAuthAccessToken } from "firebase-admin/app";

import { getDatabase } from "firebase-admin/database";

import { JWT } from "google-auth-library";

// Create Google JWT client directly
const jwt = new JWT({
  email: process.env.FB_CLIENT_EMAIL!,
  key: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  keyId: process.env.FB_PRIVATE_KEY_ID,
  scopes: [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/firebase.database",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
});

// Adapt Google JWT credentials to Firebase Admin credentials
const credential: Credential = {
  async getAccessToken(): Promise<GoogleOAuthAccessToken> {
    const { token } = await jwt.getAccessToken();
    const expiryDate = jwt.credentials.expiry_date;

    if (!token || !expiryDate) {
      throw new Error("Failed to obtain Google access token");
    }

    return {
      access_token: token,
      expires_in: Math.max(0, Math.floor((expiryDate - Date.now()) / 1000)),
    };
  },
};

// Initialize Firebase
const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential,
      projectId: process.env.FB_PROJECT_ID,
      databaseURL: process.env.FB_DATABASE_URL || `https://${process.env.FB_PROJECT_ID}.firebaseio.com`,
    });

try {
  const db = getDatabase(app);

  const ref = db.ref("users/grytysek@gmail,com/antigravity_cli/settings");

  const snapshot = await ref.get();

  console.log(snapshot.val());
} finally {
  await app.delete();
}
