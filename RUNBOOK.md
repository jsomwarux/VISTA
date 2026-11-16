# VISTA runbook

Night cards for the overnight runs. Each run does exactly one card: the first one whose line reads `- [ ] Done`.

Card format: an id and title on the `## CARD` line, the line `- [ ] Done`, then Goal, Steps, May touch, Done check (one command in backticks) and If blocked. Only the run that finishes a card ticks it. Nothing else in this file changes during a run.

Rules for every Vista card (these come from the app brief, section 7):
- Code-only. No device, no simulator, no `eas`, no `xcodebuild`, no network calls from tests.
- Never touch `PRIVACY.md`, `SUPPORT.md`, `app/privacy.tsx`, `app/terms.tsx`, `app.json`, `eas.json` or `supabase-schema.sql`.
- Never remove or change the hardcoded key fallbacks in `src/lib/tmdb.ts` and `src/lib/supabase.ts`. Shipped builds depend on them.
- Never bump the version. Never run SQL. Never push to `main`.
- Tests never import `src/lib/supabase.ts`, `src/hooks/*` or anything that calls Supabase or TMDB.
- Done checks run in a copy of the repo with no `node_modules`, no `.env` and no Supabase, TMDB or Expo variables, so they prove a fresh clone works with no secrets.

Week of Sun Nov 22, 2026: VISTA-1 (Mon Nov 23), VISTA-3 (Tue Nov 24), VISTA-4 (Wed Nov 25). VISTA-2 and feature cards come in Vista's next week, after its research pass. If the dry run slips Vista's start to Tue Nov 24, VISTA-4 waits for Vista's next week.

---

## CARD VISTA-1: Make clean-clone checks repeatable
- [ ] Done

Goal: one command proves that a fresh clone installs, typechecks and bundles for iOS with no secrets. Every later card's done check builds on it.

Facts checked on Nov 16, 2026 in a cloud container (Node 22.23.4, npm 10.9.9) on commit c1eaa39:
- Plain `npm ci` fails: "package.json and package-lock.json are not in sync. Missing: react-dom@19.3.1, scheduler@0.28.0". `npm ci --legacy-peer-deps` passes in about 13 seconds. EAS already sets `NPM_CONFIG_LEGACY_PEER_DEPS=true`, so a repo `.npmrc` matches what EAS does.
- `npx tsc --noEmit` exits 0.
- `CI=1 EXPO_OFFLINE=1 npx expo export --platform ios --output-dir <temp>` exits 0 in about 21 seconds and writes nothing inside the repo.
- The script below, run from the repo root, exited 0 in about 25 seconds. With `.npmrc` removed it exited 1. With a type error added it exited 2.

Steps:
1. Run `npm ci` once and confirm it fails as described. If it passes, note that in MORNING.md and still add `.npmrc`, because EAS uses the same setting.
2. Create `.npmrc` containing exactly one line: `legacy-peer-deps=true`
3. Create `.nvmrc` containing exactly one line: `22`
4. In `package.json`, add `"engines": { "node": ">=20.19.4" }` (the minimum for React Native 0.81) and add these scripts, keeping `start` and `ios` as they are:
   - `"typecheck": "tsc --noEmit"`
   - `"bundle": "CI=1 EXPO_OFFLINE=1 expo export --platform ios --output-dir \"${TMPDIR:-/tmp}/vista-bundle\""`
   - `"check": "npm run typecheck && npm run bundle"`
   Do not change any dependency or version field.
5. If npm rewrites `package-lock.json` (for example the root `engines` entry), commit that change. Do not regenerate the lockfile from scratch.
6. Create `scripts/clean-check.sh` with exactly this content, and make it executable:

```bash
#!/usr/bin/env bash
# Fresh-clone check: copies the repo's tracked and new (not ignored) files into
# an empty temp folder, strips app secrets from the environment, then runs
# npm ci and npm run check there. Exit 0 only if both pass.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/vista-clean.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
cd "$ROOT"
git ls-files -z --cached --others --exclude-standard | while IFS= read -r -d '' f; do [ -e "$f" ] && printf '%s\0' "$f"; done | tar --null -T - -cf - | tar -xf - -C "$WORK"
for v in $(compgen -e | grep -E '^(EXPO_PUBLIC_|EXPO_TOKEN|SUPABASE|TMDB)' || true); do unset "$v"; done
cd "$WORK"
[ ! -e node_modules ] && [ ! -e .env ] || { echo "clean-check: copy is not clean"; exit 1; }
echo "clean-check: npm ci in $WORK"
npm ci --no-audit --no-fund
echo "clean-check: npm run check"
npm run check
echo "clean-check: PASS"
```

7. Run `bash scripts/clean-check.sh` and confirm it ends with `clean-check: PASS`.
8. Prove it can fail: temporarily rename `.npmrc` and rerun (must exit non-zero), restore it, then temporarily add a file with a type error and rerun (must exit non-zero), then delete that file. Record both exit codes in MORNING.md. Leave no trace of either test in the commit.

May touch: package.json, package-lock.json, .npmrc, .nvmrc, scripts/clean-check.sh

Done check: `bash scripts/clean-check.sh`

If blocked: if `npm ci` fails even with `.npmrc` (for example a registry error in the cloud environment), or `expo export` needs the network, write BLOCKED.md with the last 40 lines of output and the exact command. Do not add dependencies, change Expo config or regenerate the lockfile to get past it.

---

## CARD VISTA-3: Add a test harness and first tests
- [ ] Done

Goal: `npm test` runs real unit tests for the pure helpers, and the clean-clone check runs them and enforces a minimum count.

Facts checked on Nov 16, 2026: with `.npmrc` in place, `npm i -D jest-expo@~54.0.0 jest@~29.7.0 @types/jest@~29.5.0` installs cleanly, a `jest.config.js` of `module.exports = { preset: 'jest-expo' };` runs a test that imports `src/constants/theme.ts`, `src/lib/contentFilter.ts`, `src/lib/tmdb.ts` and `src/lib/cache.ts`, `npx tsc --noEmit` still exits 0 with the test files included, and `npm ci` from the updated lockfile passes.

Steps:
1. Start from the week branch, which already has VISTA-1. Run `bash scripts/clean-check.sh` first. If it fails, stop and write BLOCKED.md, because VISTA-1 is broken.
2. Install the three dev dependencies above with those exact ranges (`npm i -D ...`). Do not use `npx expo install`, which needs the Expo API.
3. Create `jest.config.js` with `module.exports = { preset: 'jest-expo' };`
4. In `package.json` add `"test": "jest --ci"` and change `check` to `"npm run typecheck && npm test && npm run bundle"`.
5. Write tests under `src/lib/__tests__/` and `src/constants/__tests__/`, at least 15 in total, each its own `test(...)`:
   - `getScoreColor`: each band and each boundary (90, 89, 80, 79, 70, 69, 50, 49, 30, 29), compared against the `colors` constants, not hardcoded hex values.
   - `getGenreIcon`: a known genre, and the fallback for an unknown one.
   - `getImageUrl`: `null` path, the default size, an explicit size.
   - `getGenreName`: a known id (18 is Drama) and the result for an unknown id, as the code behaves today.
   - `filterContent`: clean text passes, and text the filter is built to catch is flagged, read from `src/lib/contentFilter.ts`.
   - `dataCache`: set then get, expiry after the 5-minute default (use `jest.useFakeTimers()` and `jest.setSystemTime`, never real waiting), `invalidate`, `invalidateAll`.
   Test behavior as it is today. Do not change any file under `src/` or `app/` to make a test pass.
6. `dataCache.set` ignores its `ttl` argument (`src/lib/cache.ts:25`). Do not fix it and do not write a test that asserts the bug. Add a QUESTIONS.md item asking JT whether a later card should fix it.
7. Extend `scripts/clean-check.sh` with two flags, `--min-tests N` and `--require TEXT` (repeatable). Add this argument parsing right after `set -euo pipefail`:

```bash
MIN_TESTS=0; REQUIRE=()
while [ $# -gt 0 ]; do
  case "$1" in
    --min-tests) MIN_TESTS="$2"; shift 2 ;;
    --require) REQUIRE+=("$2"); shift 2 ;;
    *) echo "clean-check: unknown flag $1"; exit 2 ;;
  esac
done
```

   and replace the final `echo "clean-check: PASS"` with:

```bash
if [ "$MIN_TESTS" -gt 0 ] || [ ${#REQUIRE[@]} -gt 0 ]; then
  npx jest --ci --json --outputFile "$WORK/jest.json" >/dev/null 2>&1 || { echo "clean-check: jest failed"; exit 1; }
  node -e '
    const r = require(process.argv[1]); const min = +process.argv[2]; const req = process.argv.slice(3);
    const all = r.testResults.flatMap(f => f.assertionResults);
    const passed = all.filter(a => a.status === "passed");
    const bad = all.filter(a => a.status !== "passed");
    let ok = true;
    if (bad.length) { console.log("clean-check: not passing:", bad.map(a => a.fullName + " [" + a.status + "]").join("; ")); ok = false; }
    if (passed.length < min) { console.log("clean-check: " + passed.length + " passing tests, need " + min); ok = false; }
    for (const t of req) if (!passed.some(a => a.fullName.includes(t))) { console.log("clean-check: no passing test named with: " + t); ok = false; }
    console.log("clean-check: " + passed.length + " passing tests");
    process.exit(ok ? 0 : 1);
  ' "$WORK/jest.json" "$MIN_TESTS" ${REQUIRE[@]+"${REQUIRE[@]}"}
fi
echo "clean-check: PASS"
```

   Skipped, todo and failing tests all count as not passing, so the check fails on any of them.
8. Run the done check. Then prove it can fail: rerun with `--min-tests 999` (must exit non-zero) and record the exit code in MORNING.md.

May touch: package.json, package-lock.json, jest.config.js, scripts/clean-check.sh, src/lib/__tests__/**, src/constants/__tests__/**

Done check: `bash scripts/clean-check.sh --min-tests 15`

If blocked: if jest-expo will not run under these versions, try `jest-expo@~54.0.0` with `jest@~29.7.0` only (no other combinations), then write BLOCKED.md with the error. If a helper can't be tested without changing app code, leave it out, note it in QUESTIONS.md and reach 15 with the others.

---

## CARD VISTA-4: Move the taste math into pure, tested functions
- [ ] Done

Goal: the taste stats and taste match math live in `src/lib/taste.ts` as pure functions with tests, and `useRatings.ts` calls them with no change in behavior. This is the core feature, and the later Beli taste layer idea reuses it.

Steps:
1. Start from the week branch, which already has VISTA-1 and VISTA-3. Run `bash scripts/clean-check.sh --min-tests 15` first. If it fails, stop and write BLOCKED.md.
2. Create `src/lib/taste.ts`. It may import types from `src/types` only, never Supabase, TMDB or React. Export:
   - `weightedScore(avg, count, threshold)`: `avg * Math.min(1, count / threshold)`.
   - `selectRecentFavorites(ratings, now: Date)`: the top 5 by score of ratings watched on or after 30 days before `now`, using `watched_at` and falling back to `created_at`. Build the cutoff the same way the hook does today (copy `now`, then `setDate(getDate() - 30)`).
   - `computeTasteStats(ratings, movieResults, now: Date): TasteStats`: everything `getUserTasteStats` does after its two fetches, given the ratings in the order Supabase returned them and the `{ rating, movie }` pairs. Keep it exact: `topAllTime` is the first 5 in input order (no new sort), the average is rounded, a `null` movie is skipped, only the top 3 billed cast count, directors are crew with `job === 'Director'`, genres need 5 films with threshold 8, actors 3 films with threshold 5, directors 2 films with threshold 3, each list capped at 5. The empty-ratings result stays the same.
   - `calculateTasteMatch(mine, theirs): TasteMatchResult`: everything `getTasteMatch` does after its two fetches, with the same messages, rounding and floor at 0.
3. Change `src/hooks/useRatings.ts` so `getUserTasteStats` and `getTasteMatch` keep their fetching, batching, delays and error handling, and call these functions for the math, passing `new Date()` as `now`. The hook's exported names and return shapes stay the same, so `app/(tabs)/index.tsx` and `app/user/[id].tsx` need no change.
4. Write `src/lib/__tests__/taste.test.ts` with fixture ratings and fake TMDB movies built in the test file. Put tests in `describe('calculateTasteMatch')`, `describe('computeTasteStats')`, `describe('selectRecentFavorites')` and `describe('weightedScore')`. Include at least these, with the values worked out by hand:
   - Mine {1: 80, 2: 60, 3: 90}, theirs {1: 70, 2: 60, 3: 100}: status `calculated`, score 87, overlapCount 3, avgDifference 7.
   - Two shared films: status `insufficient_overlap`, score null, message `Rate 1 more shared film`. Name this test so it contains the text insufficient_overlap.
   - One shared film: message `Rate 2 more shared films`. No shared films: message `No movies in common yet`.
   - Mine 1, theirs 99 on three films: score 0 (floored).
   - A genre in 5 films averaging 90 (weighted 56.25) ranks below a genre in 8 films averaging 70 (weighted 70), and a genre in only 4 films is left out.
   - The 4th billed actor is not counted. A crew member who isn't the Director is not counted.
   - With `now` = 2026-11-23T12:00:00Z, a film watched 29 days earlier is in the recent list, one watched 31 days earlier is not, and a rating with no `watched_at` uses `created_at`.
   - Empty ratings give the same empty result the hook returns today.
5. Run `npx tsc --noEmit` and the done check. Read the diff of `useRatings.ts` line by line against the old code and list in MORNING.md every place where the logic moved, to show nothing else changed.

May touch: src/hooks/useRatings.ts, src/lib/taste.ts, src/lib/__tests__/taste.test.ts, src/lib/__tests__/fixtures/**

Done check: `bash scripts/clean-check.sh --min-tests 28 --require insufficient_overlap --require calculateTasteMatch --require computeTasteStats --require selectRecentFavorites`

If blocked: if keeping behavior exactly the same would need a change outside May touch, or a hand-worked value above disagrees with what the current code does, do not change the expectation to match. Write BLOCKED.md with both values and the line of code, and ask in QUESTIONS.md.
