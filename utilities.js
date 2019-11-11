import gunzipMaybe from 'gunzip-maybe';
import tarFs from 'tar-fs';
import tar from 'tar-stream';
import Progress from 'progress';

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

export async function extractArchiveTo(
  packageBuffer,
  target,
  { virtualPath = 0 } = {}
) {
  return new Promise((resolve, reject) => {
    function map(header) {
      header.name = getFileName(header.name, virtualPath) || header.name;
      return header;
    }

    const gunzipper = gunzipMaybe();

    const extractor = tarFs.extract(target, { map });
    gunzipper.pipe(extractor);

    extractor.on('error', error => {
      reject(error);
    });

    extractor.on('finish', () => {
      resolve();
    });

    gunzipper.write(packageBuffer);
    gunzipper.end();
  });
}

export async function extractNpmArchiveTo(packageBuffer, target) {
  return await extractArchiveTo(packageBuffer, target, { virtualPath: 1 });
}

export async function trackProgress(cb) {
  const pace = new Progress(':bar :current/:total (:elapseds)', {
    width: 80,
    total: 1
  });

  try {
    return await cb(pace);
  } finally {
    if (!pace.complete) {
      pace.update(1);
      pace.terminate();
    }
  }
}
