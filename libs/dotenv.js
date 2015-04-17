const th = (msg) => new Error(`dotenv.js error: ${msg}`);
/**
 * Private method to get environment variables depending on detected environment
 * @returns {boolean}
 */
const get = (name) => {
  if (typeof name !== "string") {
    throw th(`typeof name !== 'string'`);
  }

  if (!name.trim()) {
    throw th(`name is an empty string`);
  }

  if (typeof process.env[name] === "undefined") {
    throw th(`variable '${name}' is undefined in process.env`);
  }

  if (!process.env[name].trim()) {
    throw th(`process.env.${name} an empty string`);
  }

  return process.env[name];
};

export default get;
