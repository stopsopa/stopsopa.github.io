// The purpose of this function here is to make little bit more strict check if its object
// because for example lodach/isObject will clasify also array as an object
// and there are cases when this distinction is needed
function isObject(o) {
  return Object.prototype.toString.call(o) === "[object Object]";
}

// module.exports = isObject;

export default isObject;
