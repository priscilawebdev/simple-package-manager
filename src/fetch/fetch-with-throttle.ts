import fetchWithRetry from "./fetch-with-retry";

const waitQueue: any[] = [];
const REQUEST_LIMIT = 10;
let activeCount = 0;

async function fetchWithThrottle(url: string) {
  if (activeCount >= REQUEST_LIMIT) {
    let startToken;
    const waitPromise = new Promise(r => (startToken = r));
    waitQueue.push(startToken);
    await waitPromise;
  }

  activeCount++;

  const result = await fetchWithRetry(url);

  activeCount--;
  if (waitQueue.length > 0) {
    waitQueue.shift()();
  }

  return result;
}

export default fetchWithThrottle;
