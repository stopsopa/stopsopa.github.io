/**
 * Firebase Admin Database helper library.
 * Initializes Firebase Admin app using service account credentials from environment variables or custom options
 * and returns database instance along with getSection(defaultSection?) factory matching USAGE.md and useFirebase.ts conventions.
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
  email?: string; // required, throw if not given, by default take from FB_EMAIL
}

export interface FirebaseMutationOptions<T = any> {
  data?: T;
  key?: string | string[];
  section?: string;
  user?: string;
}

export interface FirebaseQueryOptions {
  key?: string | string[];
  section?: string;
  user?: string;
}

export interface FirebaseSection {
  user: string;
  section?: string;
  getroot: (key?: string | string[] | FirebaseQueryOptions, optSection?: string, optUser?: string) => string;
  resolvePath: (key?: string | string[] | FirebaseQueryOptions, optSection?: string, optUser?: string) => string;
  get: <T = any>(
    keyOrOpt?: string | string[] | FirebaseQueryOptions,
    optSection?: string,
    optUser?: string
  ) => Promise<T>;
  set: <T = any>(
    opt?: FirebaseMutationOptions<T> | string | string[],
    optData?: T,
    optSection?: string
  ) => Promise<void>;
  push: <T = any>(
    opt?: FirebaseMutationOptions<T> | string | string[],
    optData?: T,
    optSection?: string
  ) => Promise<string>;
  del: (keyOrOpt?: string | string[] | FirebaseQueryOptions, optSection?: string, optUser?: string) => Promise<void>;

  // Aliases for backward compatibility
  getPath: <T = any>(user: string, key?: string | string[], optSection?: string) => Promise<T>;
  setPath: (user: string, key: string | string[], data: unknown, optSection?: string) => Promise<string>;
  pushPath: (
    user: string,
    key: string | string[],
    data: unknown,
    optSection?: string
  ) => Promise<{ path: string; itemId: string }>;
  delPath: (user: string, key: string | string[], optSection?: string) => Promise<string>;
}

export interface FirebaseInstance {
  app: App;
  db: Database;
  email: string;
  getSection: (defaultSection?: string) => FirebaseSection;
}

/**
 * Normalizes user email by replacing dots with commas for Firebase RTDB path safety.
 */
export function normalizeUser(user: string): string {
  return user.replace(/\./g, ",");
}

/**
 * Global helper to resolve a database path under users/<user>/<section>/<key>.
 * Takes user from parameter or process.env.FB_EMAIL.
 */
export function resolvePath(section?: string, key?: string | string[], user?: string): string {
  if (!section || !section.trim()) {
    throw new Error("resolvePath: section is not specified");
  }

  const rawUser = user || process.env.FB_EMAIL;
  if (!rawUser || !rawUser.trim()) {
    throw new Error("resolvePath: user is not specified (provide user or set FB_EMAIL)");
  }

  const processedUser = normalizeUser(rawUser);

  let processedKey = key;
  if (Array.isArray(processedKey)) {
    processedKey = processedKey.filter(Boolean).join("/");
  }

  let internalkey = `users/${processedUser}/${section}`;
  if (typeof processedKey === "string" && processedKey.trim()) {
    const cleanKey = processedKey.replace(/^\/+|\/+$/g, "");
    if (cleanKey) {
      internalkey += `/${cleanKey}`;
    }
  }

  return internalkey;
}

/**
 * Initializes and returns Firebase app, database, and getSection factory.
 */
export function getFirebase(options?: GetFirebaseOptions): FirebaseInstance {
  const email = options?.email || process.env.FB_EMAIL;
  if (!email || !email.trim()) {
    throw new Error("getFirebase: email is required (provide options.email or FB_EMAIL env variable)");
  }

  const normalizedUser = normalizeUser(email);
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

  const getSection = (defaultSection?: string): FirebaseSection => {
    const normalizedDefaultSection = defaultSection && defaultSection.trim() ? defaultSection.trim() : undefined;

    const activeSection = (optSection?: string): string => {
      const sec = optSection?.trim() || normalizedDefaultSection;
      if (!sec) {
        throw new Error("section is not specified");
      }
      return sec;
    };

    const getroot = (
      keyOrOpt?: string | string[] | FirebaseQueryOptions,
      optSection?: string,
      optUser?: string
    ): string => {
      let key: string | string[] | undefined;
      let sectionToUse: string | undefined = optSection;
      let userToUse: string | undefined = optUser;

      if (keyOrOpt && typeof keyOrOpt === "object" && !Array.isArray(keyOrOpt)) {
        key = keyOrOpt.key;
        if (keyOrOpt.section) {
          sectionToUse = keyOrOpt.section;
        }
        if (keyOrOpt.user) {
          userToUse = keyOrOpt.user;
        }
      } else {
        key = keyOrOpt as string | string[] | undefined;
      }

      const finalSection = activeSection(sectionToUse);
      const activeUser = userToUse ? normalizeUser(userToUse) : normalizedUser;
      return resolvePath(finalSection, key, activeUser);
    };

    const get = async <T = any>(
      keyOrOpt?: string | string[] | FirebaseQueryOptions,
      optSection?: string,
      optUser?: string
    ): Promise<T> => {
      let key: string | string[] | undefined;
      let sectionToUse: string | undefined = optSection;
      let userToUse: string | undefined = optUser;

      if (keyOrOpt && typeof keyOrOpt === "object" && !Array.isArray(keyOrOpt)) {
        key = keyOrOpt.key;
        if (keyOrOpt.section) {
          sectionToUse = keyOrOpt.section;
        }
        if (keyOrOpt.user) {
          userToUse = keyOrOpt.user;
        }
      } else {
        key = keyOrOpt as string | string[] | undefined;
      }

      const finalSection = activeSection(sectionToUse);
      const activeUser = userToUse ? normalizeUser(userToUse) : normalizedUser;
      const fullPath = resolvePath(finalSection, key, activeUser);
      const snapshot = await db.ref(fullPath).get();
      return snapshot.val() as T;
    };

    const set = async <T = any>(
      opt?: FirebaseMutationOptions<T> | string | string[],
      optData?: T,
      optSection?: string
    ): Promise<void> => {
      let key: string | string[] | undefined;
      let data: T;
      let sectionToUse: string | undefined = optSection;
      let userToUse: string | undefined;

      if (opt && typeof opt === "object" && !Array.isArray(opt)) {
        key = opt.key;
        data = opt.data as T;
        if (opt.section) {
          sectionToUse = opt.section;
        }
        if (opt.user) {
          userToUse = opt.user;
        }
      } else {
        key = opt as string | string[] | undefined;
        data = optData as T;
      }

      const finalSection = activeSection(sectionToUse);
      const activeUser = userToUse ? normalizeUser(userToUse) : normalizedUser;
      const fullPath = resolvePath(finalSection, key, activeUser);
      await db.ref(fullPath).set(data);
    };

    const push = async <T = any>(
      opt?: FirebaseMutationOptions<T> | string | string[],
      optData?: T,
      optSection?: string
    ): Promise<string> => {
      let key: string | string[] | undefined;
      let data: T;
      let sectionToUse: string | undefined = optSection;
      let userToUse: string | undefined;

      if (opt && typeof opt === "object" && !Array.isArray(opt)) {
        key = opt.key;
        data = opt.data as T;
        if (opt.section) {
          sectionToUse = opt.section;
        }
        if (opt.user) {
          userToUse = opt.user;
        }
      } else {
        key = opt as string | string[] | undefined;
        data = optData as T;
      }

      const finalSection = activeSection(sectionToUse);
      const activeUser = userToUse ? normalizeUser(userToUse) : normalizedUser;
      const fullPath = resolvePath(finalSection, key, activeUser);
      const newRef = db.ref(fullPath).push();
      await newRef.set(data);
      return `${fullPath}/${newRef.key}`;
    };

    const del = async (
      keyOrOpt?: string | string[] | FirebaseQueryOptions,
      optSection?: string,
      optUser?: string
    ): Promise<void> => {
      let key: string | string[] | undefined;
      let sectionToUse: string | undefined = optSection;
      let userToUse: string | undefined = optUser;

      if (keyOrOpt && typeof keyOrOpt === "object" && !Array.isArray(keyOrOpt)) {
        key = keyOrOpt.key;
        if (keyOrOpt.section) {
          sectionToUse = keyOrOpt.section;
        }
        if (keyOrOpt.user) {
          userToUse = keyOrOpt.user;
        }
      } else {
        key = keyOrOpt as string | string[] | undefined;
      }

      const finalSection = activeSection(sectionToUse);
      const activeUser = userToUse ? normalizeUser(userToUse) : normalizedUser;
      const fullPath = resolvePath(finalSection, key, activeUser);
      await db.ref(fullPath).remove();
    };

    // Backward-compatibility wrappers
    const getPath = async <T = any>(user: string, key?: string | string[], optSection?: string): Promise<T> => {
      return get<T>(key, optSection, user);
    };

    const setPath = async (
      user: string,
      key: string | string[],
      data: unknown,
      optSection?: string
    ): Promise<string> => {
      await set({ user, key, data, section: optSection });
      return resolvePath(activeSection(optSection), key, user);
    };

    const pushPath = async (
      user: string,
      key: string | string[],
      data: unknown,
      optSection?: string
    ): Promise<{ path: string; itemId: string }> => {
      const fullPath = await push({ user, key, data, section: optSection });
      const itemId = fullPath.split("/").pop()!;
      return { path: fullPath, itemId };
    };

    const delPath = async (user: string, key: string | string[], optSection?: string): Promise<string> => {
      await del(key, optSection, user);
      return resolvePath(activeSection(optSection), key, user);
    };

    return {
      user: normalizedUser,
      section: normalizedDefaultSection,
      getroot,
      resolvePath: getroot,
      get,
      set,
      push,
      del,
      getPath,
      setPath,
      pushPath,
      delPath,
    };
  };

  return {
    app,
    db,
    email: normalizedUser,
    getSection,
  };
}
