import axios from "axios";
import http from "http";
import https from "https";

const RETRY_TIMES = 3;
const FETCH_TIMEOUT = 20 * 1000; // in milliseconds
const CancelToken = axios.CancelToken;

const httpClient = new http.Agent({ keepAlive: true });
const httpsClient = new https.Agent({ keepAlive: true });

async function fetchWithRetry(url: string, retryTimes = RETRY_TIMES) {
  let e;
  for (let i = 0; i < retryTimes; i++) {
    const source = CancelToken.source();
    const timer = setTimeout(source.cancel, FETCH_TIMEOUT);
    try {
      const config = {
        cancelToken: source.token,
        httpAgent: httpClient,
        httpsAgent: httpsClient
      };

      if (url.endsWith(".tgz")) {
        // @ts-ignore Property 'responseType' does not exist on type
        config.responseType = "arraybuffer";
      }
      const result = await axios.get(url, config);
      if (result.status !== 200)
        throw new Error(`bad status code: ${result.status}`);
      return result;
    } catch (err) {
      e = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw e;
}

export default fetchWithRetry;
