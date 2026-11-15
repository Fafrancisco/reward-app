import { createClient } from '@supabase/supabase-js';

type Request = { method?: string; headers: { authorization?: string }; body?: unknown };
type Response = { status: (code: number) => Response; json: (value: unknown) => void };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export default async function handler(req: Request, res: Response) {
 if (req.method !== 'POST') return res.status(405).json({error:'Método não permitido'});
 const token = req.headers.authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
 const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
 if (!url || !key) return res.status(503).json({error:'Serviço não configurado'});
 if (!token) return res.status(401).json({error:'Sessão necessária'});
 const client = createClient(url,key,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:identity,error:authError} = await client.auth.getUser(token);
 if (authError || !identity.user) return res.status(401).json({error:'Sessão inválida'});
 const body = req.body as Record<string,unknown> | null;
 if (!body || !['behaviour','redeem','correct'].includes(String(body.operation)) || !['familyId','childId','targetId','requestId'].every(k=>typeof body[k]==='string' && uuid.test(body[k] as string))) return res.status(400).json({error:'Pedido inválido'});
 if (body.operation !== 'correct' && (!Number.isSafeInteger(body.expectedDelta) || body.expectedDelta === 0)) return res.status(400).json({error:'Valor inválido'});
 const {data,error} = await client.rpc('apply_points',{fid:body.familyId,cid:body.childId,operation:body.operation,target:body.targetId,request_id:body.requestId,expected_delta:body.operation === 'correct' ? null : body.expectedDelta});
 if(error) return res.status(['P0001','23505','22003'].includes(error.code) ? 422 : 503).json({error:'Não foi possível confirmar a operação.'});
 return res.status(200).json({entry:data});
}
