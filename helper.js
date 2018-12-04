const sleep = async ms => {
  return new Promise(res => {
    setTimeout(() => {
      res();
    }, ms);
  });
};

const promiseQueue = (() => {
  const _queue = [];
  let _promise = null;

  return {
    _next: function() {
      const run = async () => {
        try {
          if (_queue.length) {
            const fn = _queue.shift();
            await fn();
          }
          if (!_queue.length) {
            _promise = null;
          }
        } catch (error) {
          console.error(error);
          throw error;
        }
      };

      _promise = (_promise || Promise.resolve()).then(run, run);
    },
    push: function(fn) {
      _queue.push(fn);
      this._next();
      return this; //for chainning
    },
  };
})();

module.exports = {
  sleep,
  promiseQueue,
};
