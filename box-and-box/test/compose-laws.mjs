// test/compose-laws.mjs — run: `node test/compose-laws.mjs`
// CC2 §2 conformance for the compose runtime (COMPOSE_RUNTIME.md §2–4): the two brick
// operators are the real algebra. & is a commutative idempotent monoid on the capability
// lattice (identity &none); |> is a non-commutative monoid on a forward phase order
// (identity id) whose infeasible hand-offs ARE the absorbing zero 0̲. Both share one floor
// and accrue the CC2 semiring quantities (confidence ×, cost +, latency max).
//
// Same property-test harness as the 103 stated laws in test/laws.mjs: trial(n,body) returns
// true or a counter-example tag; runSet folds a suite; N=2000 trials/law; exit(fail?1:0).
import { V, V0, PHASES, phaseIdx, combine, consume } from '../value.mjs';
import { Brick, ZERO, isZero, none, idBrick, composeAnd, composePipe, composeTree } from '../compose.mjs';

const rnd = (a, b) => a + Math.random() * (b - a);
const approx = (a, b, t = 1e-7) => a === b || (isFinite(a) && isFinite(b) && Math.abs(a - b) <= t * (1 + Math.abs(a) + Math.abs(b)));
const setEq = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();
const arrEq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const sample = (arr) => arr.filter(() => Math.random() < 0.5);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

// equality on the value carrier (same as laws.mjs valEq — the algebraic lattice)
function valEq(a, b) {
  return approx(a.n, b.n) && a.kappa === b.kappa && approx(a.beta, b.beta) && setEq(a.sigma, b.sigma)
    && a.pi === b.pi && a.iota === b.iota && a.psi === b.psi && arrEq(a.authority, b.authority)
    && a.denyDefault === b.denyDefault && arrEq(a.audit, b.audit);
}
// the commutative sub-carrier of combine (n,κ,β,σ,deny) — the families that ARE commutative
// (π/ι/ψ/authority/audit are first-non-null / concat, so & is not globally commutative).
function valCommEq(a, b) {
  return approx(a.n, b.n) && a.kappa === b.kappa && approx(a.beta, b.beta) && setEq(a.sigma, b.sigma) && a.denyDefault === b.denyDefault;
}
const qEq = (a, b) => approx(a.confidence, b.confidence) && approx(a.cost, b.cost) && approx(a.latency, b.latency);
const hset = (h) => (h == null ? [] : Array.isArray(h) ? [...h] : [h]);
const holdersEq = (a, b) => setEq(hset(a.holder), hset(b.holder));
const asSet = (t) => (t == null ? [] : Array.isArray(t) ? t : [t]);
const contractEq = (a, b) => setEq(asSet(a.contract.accepts_from), asSet(b.contract.accepts_from)) && setEq(asSet(a.contract.feeds_into), asSet(b.contract.feeds_into));
const costClass = (b) => b.cost?.verdict?.costClass;

// a certified cost certificate of a given class (duck-typed; what compose.mjs reads).
const certOf = (cc = 'poly') => ({
  subject: { kind: 'weave-ir', hash: 'h' + ((Math.random() * 1e6) | 0) },
  analyzer: { name: 'test', version: '0' },
  verdict: { certified: true, costClass: cc, ealDepth: cc === 'poly' ? 1 : cc === 'exponential' ? 2 : 3 },
  policy: { resourceDecision: cc === 'poly' ? 'allow' : cc === 'tower' ? 'escalate' : 'budget_check', reason: 'test' }
});
const uncertCert = () => ({
  subject: { kind: 'weave-ir', hash: 'u' + ((Math.random() * 1e6) | 0) },
  analyzer: { name: 'test', version: '0' },
  verdict: { certified: false, costClass: 'unknown' },
  policy: { resourceDecision: 'annihilate', reason: 'uncertified' }
});

const TAGS = ['raw', 'mid', 'out', 'aux'];
// a FEASIBLE certified brick: sigma empty + κ false ⇒ passes the shared floor. The value carrier
// uses no n/authority/audit so combine(v,v)==v (the lattice on which & is idempotent — cost &
// quantities still accrue, which is correct and tested separately).
function randBrick(opts = {}) {
  const pi = opts.pi !== undefined ? opts.pi : (Math.random() < 0.5 ? null : pick(PHASES));
  const tags = () => (Math.random() < 0.4 ? '*' : sample(TAGS));
  return Brick({
    id: 'b' + ((Math.random() * 1e6) | 0),
    holder: Math.random() < 0.5 ? 'h' + ((Math.random() * 3) | 0) : null,
    contract: { accepts_from: opts.wild ? '*' : tags(), feeds_into: opts.wild ? '*' : tags() },
    value: V({ beta: +Math.random().toFixed(3), kappa: false, sigma: [], pi }),
    cost: certOf(opts.cc || pick(['poly', 'poly', 'elementary', 'exponential'])),
    q: { confidence: +rnd(0.2, 1).toFixed(3), cost: +rnd(0, 5).toFixed(2), latency: +rnd(0, 5).toFixed(2) },
    utility: +rnd(0, 10).toFixed(2)
  });
}
// a wild-contract brick with a fixed phase — for |> laws where we isolate the phase order.
const pipeBrick = (pi) => randBrick({ wild: true, pi });

function trial(n, body) {
  for (let i = 0; i < n; i++) { const r = body(); if (r !== true) return { pass: false, cex: r, at: i + 1 }; }
  return { pass: true, at: n };
}

// ---------------- & — COMBINE (parallel): commutative idempotent monoid on the lattice ---------
const COMB = [
  ['CA1', '& associative (carrier+quantities+cost)', (n) => trial(n, () => {
    const a = randBrick(), b = randBrick(), c = randBrick();
    const l = composeAnd(composeAnd(a, b), c), r = composeAnd(a, composeAnd(b, c));
    if (isZero(l) || isZero(r)) return 'unexpectedly-floored';
    return valEq(l.value, r.value) && holdersEq(l, r) && contractEq(l, r) && qEq(l.q, r.q) && costClass(l) === costClass(r) ? true : 'assoc'; })],
  ['CA2', '& commutative on the capability lattice', (n) => trial(n, () => {
    const a = randBrick(), b = randBrick();
    const x = composeAnd(a, b), y = composeAnd(b, a);
    if (isZero(x) || isZero(y)) return 'floored';
    return valCommEq(x.value, y.value) && holdersEq(x, y) && contractEq(x, y) && qEq(x.q, y.q) && costClass(x) === costClass(y) ? true : 'comm'; })],
  ['CA3', '& idempotent on the lattice (value carrier)', (n) => trial(n, () => {
    const a = randBrick();
    const aa = composeAnd(a, a);
    if (isZero(aa)) return 'floored';
    return valEq(aa.value, a.value) ? true : 'idem'; })],
  ['CA4', '&none identity (both sides)', (n) => trial(n, () => {
    const a = randBrick();
    const l = composeAnd(a, none()), r = composeAnd(none(), a);
    if (isZero(l) || isZero(r)) return 'floored';
    return valEq(l.value, a.value) && valEq(r.value, a.value) ? true : 'identity'; })]
];

// ---------------- |> — PIPELINE (sequence): non-commutative monoid on the forward phase order ---
const PIPE = [
  ['CP1', '|> associative where feasible', (n) => trial(n, () => {
    // forward (non-decreasing) phases ⇒ every chain is defined
    const [i, j, k] = [0, 0, 0].map(() => (Math.random() * PHASES.length) | 0).sort((x, y) => x - y);
    const a = pipeBrick(PHASES[i]), b = pipeBrick(PHASES[j]), c = pipeBrick(PHASES[k]);
    const l = composePipe(composePipe(a, b), c), r = composePipe(a, composePipe(b, c));
    if (isZero(l) || isZero(r)) return 'unexpectedly-zero';
    return valEq(l.value, r.value) && contractEq(l, r) && qEq(l.q, r.q) ? true : 'chain-assoc'; })],
  ['CP2', 'id identity (both sides)', (n) => trial(n, () => {
    const a = pipeBrick(pick(PHASES));
    const l = composePipe(a, idBrick()), r = composePipe(idBrick(), a);
    if (isZero(l) || isZero(r)) return 'zero';
    return valEq(l.value, a.value) && valEq(r.value, a.value) ? true : 'identity'; })],
  ['CP3', '|> non-commutative (backward phase ⇒ 0̲, forward survives)', (n) => trial(n, () => {
    let i = (Math.random() * PHASES.length) | 0, j = (Math.random() * PHASES.length) | 0;
    if (i === j) j = (j + 1) % PHASES.length;
    const lo = Math.min(i, j), hi = Math.max(i, j);
    const a = pipeBrick(PHASES[lo]), b = pipeBrick(PHASES[hi]);
    const fwd = composePipe(a, b), bwd = composePipe(b, a);
    return (!isZero(fwd) && isZero(bwd)) ? true : 'commuted'; })],
  ['CP4', 'infeasible hand-off (type mismatch) ⇒ 0̲', (n) => trial(n, () => {
    // disjoint, non-wildcard contracts so feeds_into ∩ accepts_from = ∅
    const a = randBrick({ pi: 'retrieve' }); a.contract.feeds_into = ['X' + ((Math.random() * 3) | 0)];
    const b = randBrick({ pi: 'act' }); b.contract.accepts_from = ['Y' + ((Math.random() * 3) | 0)];
    return isZero(composePipe(a, b)) ? true : 'fed-through'; })]
];

// ---------------- shared floor, absorbing 0̲, the CC2 semiring, the cost lattice, closure --------
const CROSS = [
  ['CX1', '0̲ absorbs both operators (both sides)', (n) => trial(n, () => {
    const a = randBrick({ wild: true });
    return isZero(composeAnd(a, ZERO)) && isZero(composeAnd(ZERO, a))
      && isZero(composePipe(a, ZERO)) && isZero(composePipe(ZERO, a)) ? true : 'leaked'; })],
  ['CX2', 'quantity semiring (confidence ×, cost +, latency max)', (n) => trial(n, () => {
    const a = pipeBrick('retrieve'), b = pipeBrick('act');
    const want = { confidence: a.q.confidence * b.q.confidence, cost: a.q.cost + b.q.cost, latency: Math.max(a.q.latency, b.q.latency) };
    const and = composeAnd(a, b), pipe = composePipe(a, b);
    if (isZero(and) || isZero(pipe)) return 'zero';
    return qEq(and.q, want) && qEq(pipe.q, want) ? true : 'semiring'; })],
  ['CX3', 'conservative cost: an uncertified child ⇒ composite 0̲', (n) => trial(n, () => {
    const a = randBrick({ wild: true });
    const bad = Brick({ id: 'u', contract: { accepts_from: '*', feeds_into: '*' }, value: V({ beta: 0.9, kappa: false, sigma: [] }), cost: uncertCert() });
    return isZero(composeAnd(a, bad)) && isZero(composePipe(a, bad)) && isZero(composePipe(bad, a)) ? true : 'uncertified-survived'; })],
  ['CX4', 'cost-class lattice: certified composite = worst class', (n) => trial(n, () => {
    const ORDER = ['poly', 'elementary', 'exponential', 'tower'];
    const ca = pick(ORDER), cb = pick(ORDER);
    const worst = ORDER[Math.max(ORDER.indexOf(ca), ORDER.indexOf(cb))];
    const a = randBrick({ wild: true, cc: ca }), b = randBrick({ wild: true, cc: cb });
    const and = composeAnd(a, b);
    if (isZero(and)) return 'floored';
    return and.cost.verdict.certified === true && costClass(and) === worst ? true : `expected ${worst}, got ${costClass(and)}`; })],
  ['CX5', 'closure: a composite is a re-composable brick', (n) => trial(n, () => {
    const a = pipeBrick('act'), b = pipeBrick('act'), c = pipeBrick('act');
    const ab = composeAnd(a, b);
    if (isZero(ab)) return 'floored';
    const isBrick = (x) => x && x.value && x.cost && x.contract && x.q && typeof x.id === 'string';
    if (!isBrick(ab)) return 'not-a-brick';
    // fold an AST whose leaf is itself a composite ⇒ the closure property end to end
    const tree = composeTree({ op: '|>', a: { op: '&', a, b }, b: c });
    return (isBrick(tree) && !isZero(tree)) ? true : 're-compose-failed'; })]
];

// ---------------- harness (Node CLI; mirrors test/laws.mjs) -----------------------------------
export function runSet(laws, N) {
  let pass = 0, fail = 0; const results = [];
  for (const [id, desc, fn] of laws) {
    const r = fn(N);
    results.push({ id, desc, pass: r.pass, cex: r.cex, at: r.at });
    if (r.pass) pass++; else fail++;
  }
  return { pass, fail, results };
}

export const SUITES = [
  { key: 'COMB',  label: '& combine  (CA1–CA4) · commutative idempotent monoid', laws: COMB },
  { key: 'PIPE',  label: '|> pipeline (CP1–CP4) · phase-graded monoid',          laws: PIPE },
  { key: 'CROSS', label: 'floor · 0̲ · semiring · cost lattice (CX1–CX5)',        laws: CROSS }
];

if (typeof process !== 'undefined' && typeof window === 'undefined') {
  const N = 2000;
  console.log(`\ncompose-runtime law harness · ${N} trials/law\n${'─'.repeat(52)}`);
  let total = 0;
  for (const suite of SUITES) {
    const r = runSet(suite.laws, N);
    console.log(`${suite.label}: ${r.pass}/${suite.laws.length} pass${r.fail ? ', ' + r.fail + ' fail' : ''}`);
    r.results.filter((x) => !x.pass).forEach((x) => console.log(`  ✗ ${x.id} ${x.desc} — ${x.cex} @trial ${x.at}`));
    total += r.fail;
  }
  console.log('─'.repeat(52));
  console.log(total === 0 ? '✓ all CC2 compose laws hold (a brick of bricks is a brick).\n' : `✗ ${total} law(s) failed.\n`);
  process.exit(total === 0 ? 0 : 1);
}
