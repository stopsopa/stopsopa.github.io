/**
 * Firebase Admin Database helper library.
 * Initializes Firebase Admin app using service account credentials from environment variables or custom options
 * and returns database instance along with helper methods (getPath, setPath, pushPath, delPath).
 */

import {
  initializeApp,
  getApps,
  deleteApp,
  type App,
  type AppOptions,
  type Credential,
  type GoogleOAuthAccessToken,
} from "firebase-admin/app";
import { getDatabase, type Database } from "firebase-admin/database";
import { JWT, type JWTOptions } from "google-auth-library";

export { deleteApp };

export interface GetFirebaseOptions {
  jwt?: JWTOptions;
  initialize?: AppOptions;
  appName?: string;
}

export interface FirebaseInstance {
  app: App;
  db: Database;
  resolvePath: (user: string, section: string, key?: string | string[]) => string;
  getPath: <T = unknown>(user: string, section: string, key?: string | string[]) => Promise<T>;
  setPath: (user: string, section: string, key: string | string[], data: unknown) => Promise<string>;
  pushPath: (user: string, section: string, key: string | string[], data: unknown) => Promise<{ path: string; itemId: string }>;
  delPath: (user: string, section: string, key: string | string[]) => Promise<string>;
}

/**
 * Resolves a database path under users/<user>/<section>/<key>
 */
export function resolvePath(
  user: string,
  section: string,
  key?: string | string[]
): string {
  const normalizedKey = Array.isArray(key)
    ? key.filter(Boolean).join("/")
    : key || "";
  const cleanKey = normalizedKey.replace(/^\/+|\/+$/g, "");
  const base = `users/${user}/${section}`;
  if (cleanKey) {
    return `${base}/${cleanKey}`;
  } else {
    return base;
  }
}

/**
 * Initializes and returns Firebase app, database, and scoped helper methods.
 */
export function getFirebase(options?: GetFirebaseOptions): FirebaseInstance {
  const existingApps = getApps();

  const jwtOptions: JWTOptions = {
    email: process.env.FB_CLIENT_EMAIL,
    key: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    keyId: process.env.FB_PRIVATE_KEY_ID,
    scopes: [
      "https://www.googleapis.com/auth/cloud-platform",
      "https://www.googleapis.com/auth/firebase.database",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    ...options?.jwt,
  };

  const jwt = new JWT(jwtOptions);

  const credential: Credential = options?.initialize?.credential || {
    async getAccessToken(): Promise<GoogleOAuthAccessToken> {
      const { token } = await jwt.getAccessToken();
      const expiryDate = jwt.credentials.expiry_date;

      if (token && expiryDate) {
        return {
          access_token: token,
          expires_in: Math.max(0, Math.floor((expiryDate - Date.now()) / 1000)),
        };
      } else {
        throw new Error("Failed to obtain Google access token");
      }
    },
  };

  const projectId = options?.initialize?.projectId || process.env.FB_PROJECT_ID;
  const databaseURL =
    options?.initialize?.databaseURL ||
    process.env.FB_DATABASE_URL ||
    (projectId ? `https://${projectId}.firebaseio.com` : undefined);

  const initializeOptions: AppOptions = {
    credential,
    projectId,
    databaseURL,
    ...options?.initialize,
  };

  let app: App;
  if (options?.appName) {
    const existing = existingApps.find((a) => a.name === options.appName);
    if (existing) {
      app = existing;
    } else {
      app = initializeApp(initializeOptions, options.appName);
    }
  } else {
    const defaultApp = existingApps.find((a) => a.name === "[DEFAULT]");
    if (defaultApp) {
      app = defaultApp;
    } else {
      app = initializeApp(initializeOptions);
    }
  }

  const db = getDatabase(app);

  const getPath = async <T = unknown>(
    user: string,
    section: string,
    key?: string | string[]
  ): Promise<T> => {
    const fullPath = resolvePath(user, section, key);
    const snapshot = await db.ref(fullPath).get();
    return snapshot.val() as T;
  };

  const setPath = async (
    user: string,
    section: string,
    key: string | string[],
    data: unknown
  ): Promise<string> => {
    const fullPath = resolvePath(user, section, key);
    await db.ref(fullPath).set(data);
    return fullPath;
  };

  const pushPath = async (
    user: string,
    section: string,
    key: string | string[],
    data: unknown
  ): Promise<{ path: string; itemId: string }> => {
    const fullPath = resolvePath(user, section, key);
    const newRef = db.ref(fullPath).push();
    await newRef.set(data);
    const itemId = newRef.key!;
    const newPath = `${fullPath}/${itemId}`;
    return { path: newPath, itemId };
  };

  const delPath = async (
    user: string,
    section: string,
    key: string | string[]
  ): Promise<string> => {
    const fullPath = resolvePath(user, section, key);
    await db.ref(fullPath).remove();
    return fullPath;
  };

  return {
    app,
    db,
    resolvePath,
    getPath,
    setPath,
    pushPath,
    delPath,
  };
}
