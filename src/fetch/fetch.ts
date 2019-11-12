import fetchWithThrottle from "./fetch-with-throttle";

async function fetch(url: string) {
  console.log("url", url);
  return await fetchWithThrottle(url);
}

export default fetch;
