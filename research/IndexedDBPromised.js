const th = (msg) => new Error(`IndexedDBPromised error: ${msg}`);

/**
 * 
    const IndexedDBPromisedInstance = new IndexedDBPromised({
      dbname: 'dbname',
      storeNames: 'storeNames',
    });

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
    storeNames: undefined,
    version: 1,
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

  this.prepare = (method) => {
    if (!this.db) {
      throw th(`getDb error: this.db not defined - call first .init() method`);
    }

    if (method) {
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

      // db.onerror = (event) => {
      //   // Generic error handler for all errors targeted at this database's
      //   // requests!
      //   error(`Database error: ${event.target.errorCode}`);
      // };
    };

    request.onupgradeneeded = (event) => {
      log("request.onupgradeneeded", event);

      const db = event.target.result;

      // // Create another object store called "names" with the autoIncrement flag set as true.
      db.createObjectStore(this.opt.storeNames, { autoIncrement: true });

      // // Because the "names" object store has the key generator, the key for the name value is generated automatically.
      // // The added records would be like:
      // // key : 1 => value : "Bill"
      // // key : 2 => value : "Donna"
      // customerData.forEach((customer) => {
      //   log("adding: ", customer);
      //   objStore.add(customer);
      //   // objStore.add(customer.name);
      // });

      // log("objStore:onupgradeneeded");
    };
  });
};

IndexedDBPromised.prototype.insert = async function (entity) {
  const { log, error } = this.prepare("insert");

  const db = await this.db;

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

    // you can add more than one, but I'm adding just one in this example
    // newCustomers.forEach((customer) => {
    const request = objectStore.add(entity);

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
  const { log, error } = this.prepare("delete");

  const db = await this.db;

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
    };

    request.onsuccess = (event) => {
      log("request.onsuccess", event);
    };
  });
};

IndexedDBPromised.prototype.get = async function (id) {
  const { log, error } = this.prepare("get");

  const db = await this.db;

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
    };

    request.onsuccess = (event) => {
      log("request.onsuccess", event);

      data = event.target.result;
    };
  });
};

IndexedDBPromised.prototype.update = async function (id, update) {
  const { log, error } = this.prepare("update");

  const db = await this.db;

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

    const request = objectStore.get(id);

    request.onerror = (event) => {
      error("request.onerror", event);
    };

    request.onsuccess = (event) => {
      const data = event.target.result;

      log("request.onsuccess", event, request);

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

      const requestUpdate = objectStore.put(entity, id);

      requestUpdate.onerror = (event) => {
        error("requestUpdate.onerror", event);
      };

      requestUpdate.onsuccess = (event) => {
        log("requestUpdate.onsuccess");
      };
    };
  });
};

IndexedDBPromised.prototype.getAll = async function () {
  const { log, error } = this.prepare("getAll");

  const db = await this.db;

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

IndexedDBPromised.prototype.getDb = async function () {
  this.prepare();

  return await this.db;
};

const isNode = typeof global !== "undefined" && Object.prototype.toString.call(global.process) === "[object process]";

if (isNode) {
  module.exports = IndexedDBPromised;
} else {
  window.IndexedDBPromised = IndexedDBPromised;
}
