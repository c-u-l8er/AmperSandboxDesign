// test/transport.mjs — run: `node test/transport.mjs`
//
// THE IDENTITY TERMS ACROSS A REAL REALM BOUNDARY. Every other check in this repo runs in one
// process, where `===` on a module singleton is trivially true. The identity design rests entirely
// on reference equality, so the question that matters is what survives a boundary that does not
// preserve references — and a `structuredClone` in the same process is a weaker test than it looks,
// because it shares a realm and a module registry with the thing it is copying.
//
// This uses a real `worker_threads` Worker: a separate realm, a separate module registry, its own
// PIPE_IDENTITY and AND_IDENTITY objects, and a structured-clone boundary in between. What it pins:
//
//   1. encodeTerm → postMessage → decodeTerm  returns the RECEIVER'S OWN singleton.       (the contract)
//   2. postMessage(idBrick()) with no encoding lands as a COUNTERFEIT and is refused,
//      by name, rather than composing as an ordinary brick carrying a free certificate.  (CD17)
//   3. An attested certificate does NOT arrive attested. Authentication is a WeakSet brand;
//      it is per-realm and it does not serialise. That is the true content of the
//      "presented vs authenticated" distinction and this is where it is measured.        (CERT3/CERT4)
//
// Point 3 is the one worth stating out loud: it is not a limitation to be fixed later. A certificate
// that has crossed a wire has, by construction, only ever been PRESENTED to the receiver.
import { Worker } from 'node:worker_threads';
import { idBrick, none, encodeTerm, createAttestationAuthority } from '../compose.mjs';

// The attestation authority is minted once per realm — this process claims it, the worker claims its
// own, and that separation is exactly what check 3 below measures.
const AUTH = createAttestationAuthority({ name: 'transport-test', verify: () => true });

const HERE = new URL('..', import.meta.url).href;

const WORKER = `
const { parentPort, workerData } = require('node:worker_threads');
import(workerData.mod).then((M) => {
  const { Brick, isZero, idBrick, none, composeAnd, composePipe, decodeTerm, ANY, TYPES, isAttested } = M;
  parentPort.on('message', (msg) => {
    const V = { n: 1, kappa: false, beta: 0.9, sigma: [], pi: null, iota: null, psi: null,
                authority: [], denyDefault: true, audit: [] };
    const partner = Brick({ id: 'far', value: V, cost: msg.cert,
      q: { confidence: 1, cost: 0, latency: 0 },
      contract: { accepts_from: ANY, feeds_into: ANY } });

    const decoded = decodeTerm(msg.encoded);
    const raw = msg.raw;

    const r = {
      decodedIsLocalSingleton: decoded === (msg.which === 'pipe' ? idBrick() : none()),
      rawIsLocalSingleton:     raw === (msg.which === 'pipe' ? idBrick() : none()),
      certArrivesAttested:     isAttested(msg.cert),
      partnerLive:             !isZero(partner),
    };
    const op = msg.which === 'pipe' ? composePipe : composeAnd;
    const viaDecoded = op(partner, decoded);
    const viaRaw     = op(partner, raw);
    r.decodedComposes  = !isZero(viaDecoded);
    r.rawRefused       = isZero(viaRaw);
    r.rawRefusal       = viaRaw.refusal || null;
    parentPort.postMessage(r);
  });
  parentPort.postMessage({ ready: true });
});
`;

const cert = AUTH.verifyAndAttest({
  subject: { kind: 'weave-ir', hash: 'transport' },
  analyzer: { name: 'test', version: '0' },
  verdict: { certified: true, costClass: 'poly' },
  policy: { resourceDecision: 'allow', reason: 'transport' }
}, { kind: 'weave-ir', hash: 'transport' });

let fails = 0;
const must = (label, cond, detail = '') => {
  console.log((cond ? '  ok   ' : '  FAIL ') + label + (detail ? `  — ${detail}` : ''));
  if (!cond) fails++;
};

const ask = (w, msg) => new Promise((res) => { w.once('message', res); w.postMessage(msg); });

const w = new Worker(WORKER, { eval: true, workerData: { mod: HERE + 'compose.mjs' } });
await new Promise((res) => w.once('message', res));            // ready

console.log('\ntransport · identity terms across a real worker_threads realm boundary');
console.log('─'.repeat(70));

for (const [which, term] of [['pipe', idBrick()], ['and', none()]]) {
  const label = which === 'pipe' ? 'id' : '&none';
  const r = await ask(w, { which, encoded: encodeTerm(term), raw: term, cert });
  console.log(`\n${label} — |> and & across the boundary`);
  must(`${label}: the sender's partner brick is live in the receiver`, r.partnerLive);
  must(`${label}: encodeTerm → postMessage → decodeTerm yields the RECEIVER's singleton`, r.decodedIsLocalSingleton);
  must(`${label}: the decoded term composes as the identity`, r.decodedComposes);
  must(`${label}: a RAW postMessage does NOT arrive as the singleton`, !r.rawIsLocalSingleton);
  must(`${label}: the un-encoded copy is REFUSED, not composed`, r.rawRefused);
  must(`${label}: the refusal names the transport fault`, /identity-not-transported/.test(r.rawRefusal || ''),
       r.rawRefusal ? `refusal: "${r.rawRefusal}"` : 'no refusal recorded');
  must(`${label}: an attested certificate arrives PRESENTED, not authenticated`, r.certArrivesAttested === false);
}

await w.terminate();
console.log('─'.repeat(70));
console.log(fails === 0
  ? '✓ the identity terms are transport-safe: encodeTerm/decodeTerm is the only crossing, and it is enforced.\n'
  : `✗ ${fails} transport check(s) failed.\n`);
process.exit(fails === 0 ? 0 : 1);
