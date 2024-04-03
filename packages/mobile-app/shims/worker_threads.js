module.exports = {
    // The SDK explicitly checks for null here, but parentPort will be undefined if we shim with an empty module.
    // https://github.com/iron-fish/ironfish/blob/8ee25c612383d4bd6e1e46ff709ed42604abc5f3/ironfish/src/workerPool/worker.ts#L268
    parentPort: null,
  };
  