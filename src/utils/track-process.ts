import Progress from "progress";

function trackProgress(cb: Function) {
  const progress = new Progress(":bar :current/:total (:elapseds)", {
    width: 80,
    total: 1,
    clear: true
  });

  try {
    return cb(progress);
  } finally {
    if (!progress.complete) {
      progress.update(1);
      progress.terminate();
    }
  }
}

export default trackProgress;
