import Progress from 'process';

async function trackProgress(cb: (value: any) => Promise<any>) {
  // @ts-ignore Type 'Process' has no construct signatures.
  const progress = new Progress(':bar :current/:total (:elapseds)', {
    width: 80,
    total: 1,
    clear: true
  });

  try {
    return await cb(progress);
  } finally {
    if (!progress.complete) {
      progress.update(1);
      progress.terminate();
    }
  }
}

export default trackProgress;
