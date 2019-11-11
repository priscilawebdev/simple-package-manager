import gunzipMaybe from 'gunzip-maybe';
import tar from 'tar-stream';

function getFileName(entryName, virtualPath) {
  let fileName = entryName;
  fileName = fileName.replace(/^\/+/, ``);

  for (let t = 0; t < virtualPath; ++t) {
    let index = fileName.indexOf(`/`);

    if (index === -1) return null;

    fileName = fileName.substr(index + 1);
  }

  return fileName;
}

export async function readFileFromArchive(
  fileName,
  buffer,
  { virtualPath = 0 } = {}
) {
  return new Promise((resolve, reject) => {
    const extractor = tar.extract();

    extractor.on('entry', (header, stream, next) => {
      if (getFileName(header.name, virtualPath) === fileName) {
        const buffers = [];

        stream.on('data', data => {
          buffers.push(data);
        });

        stream.on('error', error => {
          reject(error);
        });

        stream.on('end', () => {
          resolve(Buffer.concat(buffers));
        });
      } else {
        stream.on('end', () => {
          next();
        });
      }

      stream.resume();
    });

    extractor.on('error', error => {
      reject(error);
    });

    extractor.on('finish', () => {
      reject(new Error(`Couldn't find "${fileName}" inside the archive`));
    });

    const gunzipper = gunzipMaybe();
    gunzipper.pipe(extractor);

    gunzipper.on('error', error => {
      reject(error);
    });

    gunzipper.write(buffer);
    gunzipper.end();
  });
}

export async function readPackageJsonFromArchive(packageBuffer) {
  return await readFileFromArchive('package.json', packageBuffer, {
    virtualPath: 1
  });
}
