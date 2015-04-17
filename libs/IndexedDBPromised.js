const th = (msg) => new Error(`IndexedDBPromised error: ${msg}`);

/**
 * 
    const IndexedDBPromisedInstance = new IndexedDBPromised({
      dbname: 'dbname',
      storeNames: 'storeNames',
    });

    // but await here is actually optional. needed only if you want to surround it with try catch and catch async errors of it
    await IndexedDBPromisedInstance.init();

    var db = await IndexedDBPromisedInstance.getDb(); 


    template_data.added_user = await IndexedDBPromisedInstance.insert({
      ssn: "444-44-4844",
      name: "John",
      age: 40,
      email: "john@google.com",
    });

    template_data.deleted_user = await IndexedDBPromisedInstance.delete(id);

    template_data.get_user = await IndexedDBPromisedInstance.get(id);

    await IndexedDBPromisedInstance.update(id, (entity) => {
      const tmp = structuredClone(entity);

      tmp.email = "modified@gmail.com";

      tmp.extra = "some extra stuff";

      delete tmp.age;

      return tmp;
    });

    template_data.list = await IndexedDBPromisedInstance.getAll();

 * @param {*} opt 
 */
function IndexedDBPromised(opt) {
  this.opt = {
    log: console.log,
    error: console.log,
    dbname: undefined,
    storeNames: undefined, // for now you can only specify string, but originaly you should be able to provide array
    version: 1,
    objectStoreConfiguration: {
      // might be function then object store will be configured via function
      autoIncrement: true,
      // keyPath: "ssn",
    },
    ...opt,
  }; // make sure it's an object

  console.log(
    "opt: ",
    this.opt,
    "!Number.isInteger(this.opt.version)",
    !Number.isInteger(this.opt.version),
    "this.opt.version < 1",
    this.opt.version < 1
  );

  if (typeof this.opt.dbname !== "string" || !this.opt.dbname.trim()) {
    throw th(`this.opt.dbname is not defined`);
  }

  const storeNamesIsString = typeof this.opt.storeNames === "string";

  const storeNamesIsArray = Array.isArray(this.opt.storeNames);

  if (storeNamesIsString || storeNamesIsArray) {
    if (storeNamesIsString) {
      if (!this.opt.storeNames.trim()) {
        throw th(`storeNames is an empty string`);
      }
    }

    if (storeNamesIsArray) {
      if (storeNames.length === 0) {
        throw th(`storeNames is an empty array`);
      }
    }
  } else {
    throw th(`this.opt.objectStoreName is not a string nor array`);
  }

  if (!Number.isInteger(this.opt.version) || this.opt.version < 1) {
    throw th(`this.opt.version should be integer and it should be bigger than 0, but it is >${this.opt.version}<`);
  }

  if (typeof this.opt.objectStoreConfiguration !== "function" && !isObject(this.opt.objectStoreConfiguration)) {
    throw th(`this.opt.objectStoreConfiguration should be a function or an object`);
  }

  this.prepare = async (method) => {
    if (!this.db) {
      throw th(`getDb error: this.db not defined - call first .init() method`);
    }

    if (method) {
      const db = await this.db;

      const log = (type, data) =>
        this.opt.log({
          method,
          type,
          data,
        });

      const error = (type, error) =>
        this.opt.error({
          method,
          type,
          error,
        });

      return {
        db,
        log,
        error,
      };
    }
  };
}

IndexedDBPromised.prototype.init = function () {
  this.db = new Promise((resolve, reject) => {
    const log = (type, data) =>
      this.opt.log({
        method: "init",
        type,
        data,
      });

    const error = (type, error) =>
      this.opt.error({
        method: "init",
        type,
        error,
      });

    // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDBPromised_API/Using_IndexedDBPromised#using_a_key_generator
    var request = indexedDB.open(this.opt.dbname, this.opt.version);

    request.onerror = (event) => {
      error("request.onerror", event);

      reject(event);
    };

    request.onsuccess = (event) => {
      log("request.onsuccess", event);

      const db = event.target.result;

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      log("request.onupgradeneeded", event);

      const db = event.target.result;

      // read more about configuration of objectStore:
      // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#structuring_the_database

      if (typeof this.opt.objectStoreConfiguration === "function") {
        this.opt.objectStoreConfiguration(db, { ...this.opt });
      } else {
        db.createObjectStore(this.opt.storeNames, this.opt.objectStoreConfiguration);
      }

      log("objStore:onupgradeneeded");
    };
  });
};

IndexedDBPromised.prototype.insert = async function (entity, id) {
  const { db, log, error } = await this.prepare("insert");

  return await new Promise((resolve, reject) => {
    // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#adding_data_to_the_database

    const transaction = db.transaction(this.opt.storeNames, "readwrite");

    log("transaction", transaction);

    // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#adding_data_to_the_database
    let newInsertId;

    transaction.oncomplete = (event) => {
      log("transaction.oncomplete", event);

      resolve(newInsertId);
    };

    transaction.onerror = (event) => {
      error("transaction.onerror", event);

      reject(event);
    };

    const objectStore = transaction.objectStore(this.opt.storeNames);

    log("objectStore", objectStore);

    log("inserting", entity);

    // you can add more than one, but I'm adding just one in this example
    // newCustomers.forEach((customer) => {
    const request = objectStore.add(entity, id);

    request.onerror = (event) => {
      error("request.onerror", event);

      reject(event);
    };

    request.onsuccess = (event) => {
      log("request.onsuccess", event);

      newInsertId = event.target.result;
    };
    // });
  });
};

IndexedDBPromised.prototype.delete = async function (id) {
  const { db, log, error } = await this.prepare("delete");

  return await new Promise((resolve, reject) => {
    // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#adding_data_to_the_database

    const transaction = db.transaction(this.opt.storeNames, "readwrite");

    log("transaction", transaction);

    // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#adding_data_to_the_database

    transaction.oncomplete = (event) => {
      log("transaction.oncomplete", event);

      resolve();
    };

    transaction.onerror = (event) => {
      error("transaction.onerror", event);

      reject(event);
    };

    const objectStore = transaction.objectStore(this.opt.storeNames);

    log("objectStore", objectStore);

    const request = objectStore.delete(id);

    request.onerror = (event) => {
      error("request.onerror", event);

      reject(event);
    };

    request.onsuccess = (event) => {
      log("request.onsuccess", event);
    };
  });
};

IndexedDBPromised.prototype.set = async function (entity, id) {
  const { db, log, error } = await this.prepare("set");

  if (typeof this.opt.keyPath === "string" && this.opt.keyPath.trim()) {
    id = entity[this.opt.keyPath];
  }

  await this.delete(id);

  if (this.opt.keyPath) {
    return await this.insert(entity);
  } else {
    return await this.insert(entity, id);
  }
};

IndexedDBPromised.prototype.get = async function (id) {
  const { db, log, error } = await this.prepare("get");

  return await new Promise((resolve, reject) => {
    // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#adding_data_to_the_database

    const transaction = db.transaction(this.opt.storeNames, "readonly");

    log("transaction", transaction);

    // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#adding_data_to_the_database

    let data;

    transaction.oncomplete = (event) => {
      log("transaction.oncomplete", event);

      resolve(data);
    };

    transaction.onerror = (event) => {
      error("transaction.onerror", event);

      reject(event);
    };

    const objectStore = transaction.objectStore(this.opt.storeNames);

    log("objectStore", objectStore);

    const request = objectStore.get(id);

    request.onerror = (event) => {
      error("request.onerror", event);

      reject(event);
    };

    request.onsuccess = (event) => {
      log("request.onsuccess", event);

      data = event.target.result;
    };
  });
};

IndexedDBPromised.prototype.update = async function (update, id) {
  const { db, log, error } = await this.prepare("update");

  return await new Promise((resolve, reject) => {
    // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#adding_data_to_the_database

    const transaction = db.transaction(this.opt.storeNames, "readwrite");

    log("transaction", transaction);

    // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#adding_data_to_the_database

    transaction.oncomplete = (event) => {
      log("transaction.oncomplete", event);

      resolve();
    };

    transaction.onerror = (event) => {
      error("transaction.onerror", event);

      reject(event);
    };

    const objectStore = transaction.objectStore(this.opt.storeNames);

    log("objectStore", objectStore);

    let request;
    if (id) {
      request = objectStore.get(id);
    } else {
      if (typeof this.opt.keyPath !== "string" || !this.opt.keyPath.trim()) {
        throw th(`update called without an id, this means you should provide keyPath in the config`);
      }

      if (!update[this.opt.keyPath]) {
        throw th(`can't find id>${this.opt.keyPath}< in the given object`);
      }

      request = objectStore.get(update[this.opt.keyPath]);
    }

    request.onerror = (event) => {
      error("request.onerror", event);

      reject(event);
    };

    request.onsuccess = (event) => {
      const data = event.target.result;

      log("request.onsuccess", event, request);

      if (!data) {
        throw th(`data not found by id >${id}<`);
      }

      // Put this updated object back into the database.
      let entity;

      if (typeof update === "function") {
        try {
          entity = update(data);

          if (typeof entity === "undefined") {
            throw new Error(`update method shouldn't return undefined, probably attempt to modify by reference`);
          }
        } catch (e) {
          error("update method execution", e);
        }
      } else {
        entity = update;
      }

      console.log("...", entity, id);

      let requestUpdate;

      if (this.opt.keyPath) {
        requestUpdate = objectStore.put(entity);
      } else {
        requestUpdate = objectStore.put(entity, id);
      }

      requestUpdate.onerror = (event) => {
        error("requestUpdate.onerror", event);

        reject(event);
      };

      requestUpdate.onsuccess = (event) => {
        log("requestUpdate.onsuccess");
      };
    };
  });
};

IndexedDBPromised.prototype.getAll = async function () {
  const { db, log, error } = await this.prepare("getAll");

  return await new Promise((resolve, reject) => {
    // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#adding_data_to_the_database

    const transaction = db.transaction(this.opt.storeNames, "readwrite");

    log("transaction", transaction);

    // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#adding_data_to_the_database

    let list = {};
    transaction.oncomplete = (event) => {
      log("transaction.oncomplete", event);

      resolve(list);
    };

    transaction.onerror = (event) => {
      error("transaction.onerror", event);

      reject(event);
    };

    const objectStore = transaction.objectStore(this.opt.storeNames);

    log("objectStore", objectStore);

    objectStore.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        list[cursor.key] = cursor.value;
        cursor.continue();
      }
    };
  });
};

IndexedDBPromised.prototype.uniq = function (pattern) {
  // node.js require('crypto').randomBytes(16).toString('hex');
  pattern || (pattern = "xyxyxy");
  return pattern.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

IndexedDBPromised.prototype.getDb = async function () {
  this.prepare();

  return await this.db;
};

const isNode = typeof global !== "undefined" && Object.prototype.toString.call(global.process) === "[object process]";

if (!isNode) {
  window.IndexedDBPromised = IndexedDBPromised;
}

function isObject(o) {
  return Object.prototype.toString.call(o) === "[object Object]";
}

export default IndexedDBPromised;
