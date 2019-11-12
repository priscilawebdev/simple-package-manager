import tarFs from 'tar-fs';
import gunzipMaybe from 'gunzip-maybe';

import getFileName from '../utils/get-file-name';

function extractArchiveTo(
  buffer: any,
  target: string,
  virtualPath: number = 0
) {
  return new Promise((resolve, reject) => {
    const map = (header: any) => ({
      ...header,
      name: getFileName(header.name, virtualPath)
    });
    const gunzipper = gunzipMaybe();
    const extractor = tarFs.extract(target, { map });
    gunzipper.pipe(extractor);
    extractor.on('error', err => reject(err));
    extractor.on('finish', resolve);
    gunzipper.write(buffer);
    gunzipper.end();
  });
}

export default extractArchiveTo;
