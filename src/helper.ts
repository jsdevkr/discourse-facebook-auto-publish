export const sleep = async (ms: number) => {
  return new Promise(res => {
    setTimeout(() => {
      res();
    }, ms);
  });
};

export const promiseQueue = (() => {
  const _queue: any = [];
  let _promise: Promise<any> | null = null;

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
    push: function(fn: any) {
      _queue.push(fn);
      this._next();
      return this; //for chainning
    },
  };
})();
