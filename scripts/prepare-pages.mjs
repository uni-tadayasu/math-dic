import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const html = await readFile(new URL('dist/index.html',root),'utf8');
const page = html.replace(/((?:href|src|content)=")\.\/(?!dist\/)([^"\s]+\.(?:js|css|svg|png))(\")/g,'$1./dist/$2$3');
await writeFile(new URL('index.html',root),page);
await writeFile(new URL('.nojekyll',root),'');
console.log('Prepared root index.html for GitHub Pages.');
