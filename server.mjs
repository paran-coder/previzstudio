import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, stat } from 'node:fs/promises';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const PORT=Number(process.env.PORT||4173);
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.glb':'model/gltf-binary','.md':'text/markdown; charset=utf-8'};
function json(res,status,data){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));}
async function serveStatic(req,res){const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);const requested=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);const allowed=requested==='/index.html'||requested==='/styles.css'||requested==='/og.png'||requested.startsWith('/src/')||requested.startsWith('/assets/');if(!allowed||requested.split('/').some(part=>part.startsWith('.')))return json(res,404,{error:'파일을 찾을 수 없습니다.'});const safe=path.normalize(requested).replace(/^(\.\.[/\\])+/,'');const filePath=path.join(__dirname,safe);if(!filePath.startsWith(__dirname))return json(res,403,{error:'금지된 경로입니다.'});try{const s=await stat(filePath);if(!s.isFile())throw new Error('not file');const body=await readFile(filePath),ext=path.extname(filePath).toLowerCase();res.writeHead(200,{'content-type':MIME[ext]||'application/octet-stream','cache-control':ext==='.html'?'no-cache':'public, max-age=3600'});if(req.method==='HEAD')res.end();else res.end(body);}catch{json(res,404,{error:'파일을 찾을 수 없습니다.'});}}
export async function handleRequest(req,res){if(req.method==='GET'&&req.url==='/api/health')return json(res,200,{ok:true,version:'1.3.2',director:'local-command-parser',render:'browser'});if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'지원하지 않는 메서드입니다.'});return serveStatic(req,res);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){http.createServer((req,res)=>handleRequest(req,res)).listen(PORT,'127.0.0.1',()=>console.log(`Previz Studio v1.3.2: http://127.0.0.1:${PORT}`));}
