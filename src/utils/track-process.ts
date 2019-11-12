import cliProgress from 'cli-progress';
import chalk from 'chalk';

async function trackProgress(callback: any) {
  // create new progress bar
  const progress = new cliProgress.Bar({
    format:
      'CLI Progress |' +
      chalk.cyan('{bar}') +
      '| {percentage}% || {value}/{total} Chunks || Speed: {speed}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });

  try {
    return await callback(progress);
  } finally {
    // update values
    progress.update(1);
    // // stop the bar
    // progress.stop();
  }
}

export default trackProgress;
