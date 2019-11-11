function getFileName(entryName: string, virtualPath: number) {
  let fileName = entryName;
  fileName = entryName.replace(/^\/+/, '');
  for (let i = 0; i < virtualPath; i++) {
    const index = fileName.indexOf('/');
    if (index === -1) {
      return null;
    }
    fileName = fileName.substr(index + 1);
  }
  return fileName;
}

export default getFileName;
