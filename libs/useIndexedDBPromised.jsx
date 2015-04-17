import { useState, useEffect } from "react";

import IndexedDBPromised from "./IndexedDBPromised.js";

export default function useIndexedDBPromised(dbname, objectStoreName) {
  const [indexed, setIndexed] = useState();

  useEffect(() => {
    const IndexedDBPromisedInstance = new IndexedDBPromised({
      dbname,
      storeNames: objectStoreName,
      // objectStoreConfiguration: { keyPath: "ssn" },
      objectStoreConfiguration: (db, opt) => {
        const objectStore = db.createObjectStore(opt.storeNames, { keyPath: opt.keyPath });

        // Create an index to search customers by name. We may have duplicates
        // so we can't use a unique index.
        //   objectStore.createIndex("name", "name", { unique: false });

        // Create an index to search customers by email. We want to ensure that
        // no two customers have the same email, so use a unique index.
        //   objectStore.createIndex("email", "email", { unique: true });
      },
      // this is extra param which is consumed by update method
      // in order to find key value from given object
      keyPath: "key",
    });

    setIndexed(IndexedDBPromisedInstance);

    IndexedDBPromisedInstance.init();
  }, []);

  return indexed;
}
