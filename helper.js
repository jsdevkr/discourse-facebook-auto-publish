const sleep = async (ms) => {
  return new Promise((res) => {
    setTimeout(() => {
      res();
    }, ms);
  });
};

const promiseQueue = (()=>{
  let _promise;
  return {
    push: function(fn) {
      _promise = _promise || Promise.resolve();
      _promise = _promise.then(fn, fn);
      return this; //for chainning
    }
  };
})();

module.exports = {
  sleep,
  promiseQueue
}