import {randomBytes, scrypt, timingSafeEqual, createHash} from 'node:crypto';
import {promisify} from 'node:util';
const derive=promisify(scrypt);
export const TTL=60*60*24*14;
export const userKey=u=>`mw4:v2:user:${u}`;
export const progressKey=u=>`mw4:v2:progress:${u}`;
export const sessionKey=t=>`mw4:v2:session:${createHash('sha256').update(t).digest('hex')}`;
export const username=v=>typeof v==='string'?v.trim().toLowerCase():'';
export const validUser=u=>/^[a-z0-9_]{3,24}$/.test(u);
export const validPassword=p=>typeof p==='string'&&p.length>=10&&Buffer.byteLength(p)<=256;
export async function hashPassword(p){const salt=randomBytes(16).toString('hex');return `${salt}:${(await derive(p,salt,64)).toString('hex')}`}
export async function checkPassword(p,h){const [salt,digest]=(h||'00000000000000000000000000000000:'+ '00'.repeat(64)).split(':');const actual=await derive(p,salt,64);const expected=Buffer.from(digest,'hex');return expected.length===actual.length&&timingSafeEqual(expected,actual)}
export async function redis(cmd){const {UPSTASH_REDIS_REST_URL:url,UPSTASH_REDIS_REST_TOKEN:token}=process.env;if(!url||!token)throw Error('Database not configured');const r=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(cmd)});const j=await r.json();if(!r.ok||j.error)throw Error('Database request failed');return j.result}
export function tokenFrom(req){const t=(req.headers.cookie||'').match(/(?:^|;\s*)mw4_session=([a-f0-9]{64})(?:;|$)/)?.[1];return t||null}
export function cookie(res,t,age=TTL){res.setHeader('Set-Cookie',`mw4_session=${t}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${process.env.VERCEL||process.env.NODE_ENV==='production'?'; Secure':''}`)}
export async function session(req,db=redis){const t=tokenFrom(req);if(!t)return null;const u=await db(['GET',sessionKey(t)]);return typeof u==='string'&&validUser(u)?u:null}
export async function issue(res,u,db=redis){const t=randomBytes(32).toString('hex');await db(['SET',sessionKey(t),u,'EX',TTL]);cookie(res,t)}
export function sameOrigin(req){if(req.headers['sec-fetch-site']==='cross-site')return false;try{return !!req.headers.origin&&new URL(req.headers.origin).host===req.headers.host}catch{return false}}
export function body(req){return typeof req.body==='string'?JSON.parse(req.body):req.body}
export async function rateLimit(key,limit,seconds,db=redis){const count=await db(['EVAL',"local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n",1,key,seconds]);return Number(count)<=limit}
