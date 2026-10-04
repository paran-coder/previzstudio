import http from 'node:http';
import {readFile,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.webm':'video/webm','.mp4':'video/mp4'};
http.createServer(async(req,res)=>{try{
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
 let url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(url==='/')url='/2026-09-20-index.html';
 if(!/^\/2026-09-20-(index\.html|(?:style|visual-fixes)\.css|(?:app|stage|model)\.mjs|dependencies\/node_modules\/three\/.*)$/.test(url)){res.writeHead(404);return res.end('Not found');}
 const file=await realpath(path.join(root,url));const rel=path.relative(root,file);if(rel.startsWith('..')||path.isAbsolute(rel))throw Error('Forbidden');
 const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('Previz Studio-v1.0.0 · http://127.0.0.1:4173'));
