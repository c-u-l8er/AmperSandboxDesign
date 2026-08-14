// test/compose-laws.mjs — run: `node test/compose-laws.mjs`
// CC2 §2 conformance for the compose runtime (COMPOSE_RUNTIME.md §2–4): the two brick
// operators are the real algebra. & is a commutative idempotent monoid on the capability
// lattice (identity &none); |> is a non-commutative monoid on a forward phase order
// (identity id) whose infeasible hand-offs ARE the absorbing zero 0̲. Both share one floor
// and accrue the CC2 semiring quantities (confidence ×, cost +, latency max).
//
// Same property-test harness as the 103 stated laws in test/laws.mjs: trial(n,body) returns
// true or a counter-example tag; runSet folds a suite; N=2000 trials/law; exit(fail?1:0).
// 14 laws: CA1–CA4 (&), CP1–CP4 (|>), CX1–CX6 (floor/semiring/cost-lattice/closure/fail-closed).
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
    return (isBrick(tree) && !isZero(tree)) ? true : 're-compose-failed'; })],
  ['CX6', 'fail-closed: a malformed/partial child ⇒ 0̲ or a valid Brick, never an exception', (n) => trial(n, () => {
    // a fuzzer of partial + garbage operands — the threat directive 1 forbids: a throw where
    // 0̲ (or a normalized Brick) is the correct answer. Covers both the Brick() entry point
    // (partial params, B3's repro shape) and raw non-brick operands passed straight to the ops.
    const garbageVal = () => pick([
      { beta: 0.9 },                       // partial Value (B3): missing sigma/authority/audit
      { sigma: 42 },                       // non-iterable array field
      { beta: 'high', kappa: 1, sigma: null },
      'not-an-object', 42, null, undefined, [], { error: 'π-violation' },
      { authority: 'x', audit: 7, n: NaN }
    ]);
    const garbageBrickParams = () => pick([
      { id: 7, value: garbageVal(), cost: { rung: 1 }, q: 'nope', laws: 5, floor: 0 },
      { value: garbageVal() },
      { value: garbageVal(), cost: garbageVal() },
      garbageVal(),                        // the whole param object is garbage
      undefined
    ]);
    // operands: half via the public constructor (with garbage params), half raw garbage objects
    const mk = () => (Math.random() < 0.5 ? Brick(garbageBrickParams()) : garbageVal());
    const isBrick = (x) => x && typeof x === 'object' && x.value && x.cost && x.contract && x.q && typeof x.id === 'string';
    const ok = (x) => isZero(x) || isBrick(x);
    try {
      const a = mk(), b = mk(), c = mk();
      if (!ok(composeAnd(a, b))) return 'and-not-brick-or-zero';
      if (!ok(composePipe(a, b))) return 'pipe-not-brick-or-zero';
      if (!ok(composeTree({ op: '|>', a: { op: '&', a, b }, b: c }))) return 'tree-not-brick-or-zero';
      // and the original B3 repro shape specifically resolves (here: uncertified cost ⇒ 0̲)
      const r = composeAnd(Brick({ id: 'a', value: { beta: 0.9 }, cost: { rung: 1 }, q: {} }),
                           Brick({ id: 'b', value: { beta: 0.8 }, cost: { rung: 1 }, q: {} }));
      return ok(r) ? true : 'b3-repro-not-resolved';
    } catch (e) {
      return `threw:${e.constructor.name}:${e.message}`;
    }
  })]
];

// ---------------- KNOWN GAPS (xfail) — laws that SHOULD hold but a real soundness bug FALSIFIES ---
// The |> phase-floor is NOT association-invariant. chain() (value.mjs) refuses a backward step on
// the IMMEDIATE pair but sets the composite's exit phase to the LATER stage, and a Value carries a
// single π — so a|>(b|>c) collapses (b|>c) to its EXIT phase and the outer guard never sees b's
// earlier ENTRY phase. Counterexample π=[act,retrieve,consolidate]: (a|>b)|>c = 0̲ (floor fires) but
// a|>(b|>c) = LIVE (floor BYPASSED) — reachable through the public composeTree with a right-leaning
// AST, not just manual nesting. CP1 cannot see it because it only ever draws SORTED phases.
// These are XFAIL: they do NOT fail the build while open (the enforced laws stay green); the build
// FAILS only if one starts PASSING — the signal the fix landed and the law should be promoted into a
// real suite. Found by the residency falsifier — see the-residency/EVIDENCE/algebra-finding.md.
//
// ROOT CAUSE (the deepening): "|> is non-associative" is a SYMPTOM. The disease is Value.pi — a
// SINGLE-slot phase carrier set ORDER-DEPENDENTLY by combine()'s firstNonNull and READ by |>'s floor.
// CP5/CP6 are symptom 1 (|> re-association). CP7 is symptom 2: combine() picks pi order-dependently,
// so &-operand order leaks into a downstream |> floor — even though & is advertised commutative and
// &'s OWN floor IS commutative (see ANCHOR/AC-COMM below, which PASSES). CP7 breaks fix Option 2
// (left-fold-only |>): there is no |> re-grouping to outlaw here. Only carrying an [entry,exit]
// interval (Option 1) closes both symptoms.
const rndPhase = () => PHASES[(Math.random() * PHASES.length) | 0];
const descends = (ps) => ps.some((p, i) => i > 0 && phaseIdx(ps[i - 1]) > phaseIdx(p));
export const GAP = [
  ['CP5', 'the |> floor is ASSOCIATION-INVARIANT: isZero((a|>b)|>c) === isZero(a|>(b|>c))', (n) => trial(n, () => {
    const a = pipeBrick(rndPhase()), b = pipeBrick(rndPhase()), c = pipeBrick(rndPhase());
    const l = composePipe(composePipe(a, b), c), r = composePipe(a, composePipe(b, c));
    return isZero(l) === isZero(r) ? true
      : `π=[${a.value.pi}, ${b.value.pi}, ${c.value.pi}] → (a|>b)|>c ${isZero(l) ? '0̲' : 'live'}, a|>(b|>c) ${isZero(r) ? '0̲' : 'live'}`; })],
  ['CP6', 'NO backward execution step survives |>, in either association', (n) => trial(n, () => {
    const ps = [rndPhase(), rndPhase(), rndPhase()];
    const [a, b, c] = ps.map((p) => pipeBrick(p));
    if (!descends(ps)) return true; // law only constrains backward sequences
    const l = composePipe(composePipe(a, b), c), r = composePipe(a, composePipe(b, c));
    return (isZero(l) && isZero(r)) ? true
      : `π=[${ps.join(', ')}] has a backward step yet survives: (a|>b)|>c ${isZero(l) ? '0̲' : 'LIVE'}, a|>(b|>c) ${isZero(r) ? '0̲' : 'LIVE'}`; })],
  ['CP7', '&-operand order does not change a downstream |> floor: isZero((a&b)|>c) === isZero((b&a)|>c)', (n) => trial(n, () => {
    const a = pipeBrick(rndPhase()), b = pipeBrick(rndPhase()), c = pipeBrick(rndPhase());
    const l = composePipe(composeAnd(a, b), c), r = composePipe(composeAnd(b, a), c);
    return isZero(l) === isZero(r) ? true
      : `π=[${a.value.pi}, ${b.value.pi}, ${c.value.pi}] → (a&b)|>c ${isZero(l) ? '0̲' : 'LIVE'}, (b&a)|>c ${isZero(r) ? '0̲' : 'LIVE'} (& is "commutative")`; })]
];

// PASSING anchor — pins what IS sound about &: its OWN floor is commutative (operand order does not
// change whether a coalition annihilates), because the floor reads only commutative inputs and NOT
// pi/authority/audit. Unlike GAP, a FAILURE here counts against the build — a green anchor next to
// the red gaps. If this ever falsifies, & developed a |>-class bug of its own.
export const ANCHOR = [
  ['AC-COMM', "&'s OWN floor is commutative: isZero(a&b) === isZero(b&a)", (n) => trial(n, () => {
    const a = pipeBrick(rndPhase()), b = pipeBrick(rndPhase());
    return isZero(composeAnd(a, b)) === isZero(composeAnd(b, a)) ? true
      : `π=[${a.value.pi}, ${b.value.pi}] a&b ${isZero(composeAnd(a, b)) ? '0̲' : 'live'}, b&a ${isZero(composeAnd(b, a)) ? '0̲' : 'live'}`; })]
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
  { key: 'CROSS', label: 'floor · 0̲ · semiring · cost lattice · fail-closed (CX1–CX6)', laws: CROSS }
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
  // passing anchors: green laws that pin what IS sound; a failure here counts against the build.
  const anchor = runSet(ANCHOR, N);
  console.log(`anchors (passing · what is provably sound): ${anchor.pass}/${ANCHOR.length} pass${anchor.fail ? ', ' + anchor.fail + ' fail' : ''}`);
  anchor.results.filter((x) => !x.pass).forEach((x) => console.log(`  ✗ ${x.id} ${x.desc} — ${x.cex} @trial ${x.at}`));
  total += anchor.fail;
  // known gaps (xfail): report them, never fail the build WHILE OPEN, but ALARM on an xpass —
  // a gap law that starts passing means the carrier fix landed and it must be promoted to a real suite.
  let xpass = 0;
  console.log(`known gaps (xfail · expected FALSIFIED until the Value.pi carrier fix lands):`);
  for (const [id, desc, fn] of GAP) {
    const r = fn(N);
    if (r.pass) { xpass++; console.log(`  ⚠ ${id} ${desc} — NOW PASSES: the fix landed? promote it into a suite and drop from GAP.`); }
    else console.log(`  ✗ ${id} ${desc} — FALSIFIED @trial ${r.at} (known gap)${r.cex ? '  ' + r.cex : ''}`);
  }
  console.log('─'.repeat(52));
  // Count is DERIVED, never a literal. This banner previously read a hard-coded "116", which was
  // the OLD whole-kernel total mislabelled as a compose-only count — overstating this suite ~8×.
  const suiteN = SUITES.reduce((n, s) => n + s.laws.length, 0);
  const enforced = suiteN + ANCHOR.length;
  console.log(total === 0
    ? `✓ all ${enforced} enforced CC2 compose laws hold — ${suiteN} suite + ${ANCHOR.length} anchor (a brick of bricks is a brick).`
    : `✗ ${total} of ${enforced} enforced law(s) failed.`);
  console.log(xpass
    ? `⚠ ${xpass} known-gap law(s) now PASS — promote them out of GAP (build fails to force it).\n`
    : `· ${GAP.length} known gap(s) still open (xfail) — see the-residency/EVIDENCE/algebra-finding.md.\n`);
  process.exit((total === 0 && xpass === 0) ? 0 : 1);
}
