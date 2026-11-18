VISTA runbook. Overnight runs read this file. JT and Vista's chat change it only through pull requests.

Format notes:
- Three parts, in order: APP COMPLETE MEANS, THIS WEEK, FULL PLAN.
- Each run does exactly one card from THIS WEEK: the first one whose line reads `- [ ] Done`. A PLANNED item in FULL PLAN is never tonight's card. Each WEEK PREP moves the next PLANNED items into THIS WEEK as CARDs.
- A card is a `## CARD <ID>: <title>` heading, the line `- [ ] Done`, then lines starting Goal:, Steps:, May touch:, Done check: and If blocked:. May touch is one line of comma-separated globs. Done check is one command in backticks, with no &&, ||, ;, | or $( ). Fenced code blocks inside Steps are skipped by the parser.
- After a PASS, a night may refine the Steps of the next card (or of the first PLANNED item after the week's last card), and nothing else in this file except ticking its own card. Anything that must not drift lives in Goal, May touch, Done check, If blocked or the Vista rules below.

Vista rules for every card and PLANNED item (from the app brief, section 7). A night never edits these:
- Code-only. No device, no simulator, no `eas`, no `xcodebuild`, no network calls from tests.
- Never touch `PRIVACY.md`, `SUPPORT.md`, `app/privacy.tsx`, `app/terms.tsx`, `app.json`, `eas.json` or `supabase-schema.sql`, unless a card's May touch lists the file.
- Never remove or change the hardcoded key fallbacks in `src/lib/tmdb.ts` and `src/lib/supabase.ts`. Shipped builds depend on them.
- Never bump the version. Never run SQL. Never push to `main`. A SQL migration is written as a file for JT to apply, never applied.
- Tests never import `src/lib/supabase.ts`, `src/hooks/*` or anything that calls Supabase or TMDB, unless the client is replaced by a mock in that test.
- Done checks run `scripts/clean-check.sh`, which copies the repo into an empty folder with no `node_modules`, no `.env` and no Supabase, TMDB or Expo variables, so they prove a fresh clone works with no secrets. A night never weakens that script or deletes, skips or loosens a test.
- Expected values written into a Goal or a test by hand are never changed to match the code. If the code disagrees, write BLOCKED.md and ask in QUESTIONS.md.

# APP COMPLETE MEANS

Draft from the Nov 12 brief. Vista's research pass (its next WEEK PREP) confirms or changes it.
- A fresh clone installs, typechecks, runs its unit tests and bundles for iOS with one command and no secrets.
- The taste stats and taste match math are pure functions with tests, and the profile loads its taste stats without one TMDB call per rated film on every visit.
- No user's email is readable by other users. The migration is written here, and JT applies it to the live database.
- Blocking hides the blocked person everywhere (feed, movie ratings, comments, search, notifications), with an Unblock button, and reports can be reviewed. This closes the Apple guideline 1.2 gap.
- The 500-character review limit is enforced, not only counted.
- Push is either finished with a real sender or removed, per JT's answer.
- PRIVACY.md, SUPPORT.md and the in-app privacy and terms screens match what the app does, as drafts JT approves and applies.
- The app shows TMDB attribution as TMDB's terms require.
- CI runs the clean-clone check on every pull request.

# THIS WEEK (week of 2026-11-22)

VISTA-1 (Mon Nov 23), VISTA-3 (Tue Nov 24), VISTA-4 (Wed Nov 25). If the dry run slips Vista's start to Tue Nov 24, VISTA-4 waits for Vista's next week.

## CARD VISTA-1: Make clean-clone checks repeatable
- [ ] Done

Goal: one command proves that a fresh clone installs, typechecks and bundles for iOS with no secrets. Every later card's done check builds on it.

Steps:
0. Known facts, checked on Nov 16, 2026 in a cloud container (Node 22.23.4, npm 10.9.9) on commit c1eaa39:
- Plain `npm ci` fails: "package.json and package-lock.json are not in sync. Missing: react-dom@19.3.1, scheduler@0.28.0". `npm ci --legacy-peer-deps` passes in about 13 seconds. EAS already sets `NPM_CONFIG_LEGACY_PEER_DEPS=true`, so a repo `.npmrc` matches what EAS does.
- `npx tsc --noEmit` exits 0.
- `CI=1 EXPO_OFFLINE=1 npx expo export --platform ios --output-dir <temp>` exits 0 in about 21 seconds and writes nothing inside the repo.
- The script below, run from the repo root, exited 0 in about 25 seconds. With `.npmrc` removed it exited 1. With a type error added it exited 2.
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

Steps:
0. Known facts, checked on Nov 16, 2026: with `.npmrc` in place, `npm i -D jest-expo@~54.0.0 jest@~29.7.0 @types/jest@~29.5.0` installs cleanly, a `jest.config.js` of `module.exports = { preset: 'jest-expo' };` runs a test that imports `src/constants/theme.ts`, `src/lib/contentFilter.ts`, `src/lib/tmdb.ts` and `src/lib/cache.ts`, `npx tsc --noEmit` still exits 0 with the test files included, and `npm ci` from the updated lockfile passes.
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

Goal: the taste stats and taste match math live in `src/lib/taste.ts` as pure functions with tests, and `useRatings.ts` calls them with no change in behavior. Fixed expectations, worked out by hand from the current code, that tests must assert and no night may change: mine {1: 80, 2: 60, 3: 90} vs theirs {1: 70, 2: 60, 3: 100} gives status calculated, score 87, overlapCount 3, avgDifference 7; two shared films give status insufficient_overlap, score null, message "Rate 1 more shared film"; one shared film gives "Rate 2 more shared films"; none gives "No movies in common yet"; 1 vs 99 on three films gives score 0; a genre in 5 films averaging 90 (weighted 56.25) ranks below one in 8 films averaging 70 (weighted 70), and a genre in 4 films is left out; with now = 2026-11-23T12:00:00Z a film watched 29 days earlier is recent and one watched 31 days earlier is not.

Steps:
1. Start from the week branch, which already has VISTA-1 and VISTA-3. Run `bash scripts/clean-check.sh --min-tests 15` first. If it fails, stop and write BLOCKED.md.
2. Create `src/lib/taste.ts`. It may import types from `src/types` only, never Supabase, TMDB or React. Export:
   - `weightedScore(avg, count, threshold)`: `avg * Math.min(1, count / threshold)`.
   - `selectRecentFavorites(ratings, now: Date)`: the top 5 by score of ratings watched on or after 30 days before `now`, using `watched_at` and falling back to `created_at`. Build the cutoff the same way the hook does today (copy `now`, then `setDate(getDate() - 30)`).
   - `computeTasteStats(ratings, movieResults, now: Date): TasteStats`: everything `getUserTasteStats` does after its two fetches, given the ratings in the order Supabase returned them and the `{ rating, movie }` pairs. Keep it exact: `topAllTime` is the first 5 in input order (no new sort), the average is rounded, a `null` movie is skipped, only the top 3 billed cast count, directors are crew with `job === 'Director'`, genres need 5 films with threshold 8, actors 3 films with threshold 5, directors 2 films with threshold 3, each list capped at 5. The empty-ratings result stays the same.
   - `calculateTasteMatch(mine, theirs): TasteMatchResult`: everything `getTasteMatch` does after its two fetches, with the same messages, rounding and floor at 0.
3. Change `src/hooks/useRatings.ts` so `getUserTasteStats` and `getTasteMatch` keep their fetching, batching, delays and error handling, and call these functions for the math, passing `new Date()` as `now`. The hook's exported names and return shapes stay the same, so `app/(tabs)/index.tsx` and `app/user/[id].tsx` need no change.
4. Write `src/lib/__tests__/taste.test.ts` with fixture ratings and fake TMDB movies built in the test file. Put tests in `describe('calculateTasteMatch')`, `describe('computeTasteStats')`, `describe('selectRecentFavorites')` and `describe('weightedScore')`. Include at least these:
   - Every fixed expectation in this card's Goal, one test each. Name the two-shared-films test so it contains the text insufficient_overlap.
   - The 4th billed actor is not counted. A crew member who isn't the Director is not counted.
   - A rating with no `watched_at` uses `created_at`.
   - Empty ratings give the same empty result the hook returns today.
5. Run `npx tsc --noEmit` and the done check. Read the diff of `useRatings.ts` line by line against the old code and list in MORNING.md every place where the logic moved, to show nothing else changed.

May touch: src/hooks/useRatings.ts, src/lib/taste.ts, src/lib/__tests__/taste.test.ts, src/lib/__tests__/fixtures/**

Done check: `bash scripts/clean-check.sh --min-tests 28 --require insufficient_overlap --require calculateTasteMatch --require computeTasteStats --require selectRecentFavorites`

If blocked: if keeping behavior exactly the same would need a change outside May touch, or a fixed expectation in the Goal disagrees with what the current code does, do not change the expectation to match. Write BLOCKED.md with both values and the line of code, and ask in QUESTIONS.md.

# FULL PLAN

Draft until Vista's research pass. WEEK PREP turns the next items into CARDs, adds full Steps, and may tighten a Done check. IDs 2 and 5 match section 11 of the brief.

## PHASE 1: Privacy and App Store safety

### PLANNED VISTA-2: Stop exposing emails (prepare only; JT applies)
Goal: no query returns another user's email. Replace `users(*)` and `.select('*')` on `users` with explicit public columns, keep your own email readable, and write `supabase/migrations/<date>_hide_user_email.sql` that limits the `users` read policy and pins `search_path` on `delete_own_account`. Copy the change into `supabase-schema.sql`. JT applies the migration and decides the policy before this runs (brief notes, item 4).
Steps: add a test that reads the source files from disk and fails if `users(*)` or `.select('*')` on `users` appears in `src/` or `app/`, and that the migration file exists and mentions `search_path`. Name it so it contains hidden_email.
May touch: src/hooks/useRatings.ts, src/hooks/useSocial.ts, src/hooks/useAuth.tsx, supabase/migrations/**, supabase-schema.sql, src/lib/__tests__/**
Done check: `bash scripts/clean-check.sh --min-tests 30 --require hidden_email`
If blocked: if any screen needs another user's email, list it in QUESTIONS.md and stop.

### PLANNED VISTA-5: Make blocking hide people
Goal: blocked users are left out of the feed, movie ratings, comments, user search and notifications, and their profile shows an Unblock button. JT checks it on a phone before release.
Steps: move the blocked-id filtering into a pure helper in `src/lib/`, test it, and test each hook query with a mocked Supabase client. Name the tests so they contain blocked_filter.
May touch: src/hooks/useRatings.ts, src/hooks/useSocial.ts, src/hooks/useNotifications.ts, app/user/[id].tsx, src/lib/**
Done check: `bash scripts/clean-check.sh --min-tests 35 --require blocked_filter`
If blocked: if hiding needs a database change, write the migration file for JT and stop.

### PLANNED VISTA-6: Enforce the 500-character review limit
Goal: a review over 500 characters can't be saved, on both create and edit, and the counter matches the rule.
Steps: add a pure validator in `src/lib/`, use it in `app/rate.tsx` and in `createRating`, and test the boundary at 500 and 501. Name the tests so they contain review_limit.
May touch: app/rate.tsx, src/hooks/useRatings.ts, src/lib/**
Done check: `bash scripts/clean-check.sh --min-tests 37 --require review_limit`
If blocked: if the database has its own limit that differs, ask in QUESTIONS.md.

### PLANNED VISTA-7: Prepare report review (JT applies)
Goal: JT can see and act on new rows in `reports`. Write a migration file with a view of open reports, and a short `docs/REPORTS.md` with the exact steps for JT to review them in the Supabase dashboard.
Steps: test that the migration file exists and selects from `reports`. Name it so it contains reports_review.
May touch: supabase/migrations/**, docs/REPORTS.md, src/lib/__tests__/**
Done check: `bash scripts/clean-check.sh --min-tests 38 --require reports_review`
If blocked: needs JT's answer to brief question 8 (who reviews reports, and how fast).

## PHASE 2: Docs match the app

### PLANNED VISTA-8: Draft corrected privacy and support pages (JT applies)
Goal: drafts of PRIVACY.md and SUPPORT.md that match the code: account deletion location and timing, no data export promise unless built, no analytics claim, and email visibility after VISTA-2. The real files stay untouched. JT publishes them, likely to a public jsomwarux/vista-legal repo so VISTA can go private.
Steps: write `docs/drafts/PRIVACY.draft.md` and `docs/drafts/SUPPORT.draft.md`, each marked DRAFT FOR EVE at the top, and a test that both exist and carry that marker. Name it so it contains legal_drafts. The real files are protected by May touch.
May touch: docs/drafts/**, src/lib/__tests__/**
Done check: `bash scripts/clean-check.sh --min-tests 39 --require legal_drafts`
If blocked: if a claim depends on the live Supabase setup, ask in QUESTIONS.md.

### PLANNED VISTA-9: TMDB attribution
Goal: the app shows the TMDB logo and the notice TMDB's terms require, on a screen other than the privacy and terms screens.
Steps: add a small attribution component, place it on the Explore tab footer, and test that it renders the notice text. Name it so it contains tmdb_attribution. JT checks it on a phone.
May touch: src/components/**, app/(tabs)/explore.tsx, assets/**, src/components/__tests__/**
Done check: `bash scripts/clean-check.sh --min-tests 40 --require tmdb_attribution`
If blocked: the research pass confirms TMDB's exact wording and logo rules first.

## PHASE 3: Speed and upkeep

### PLANNED VISTA-10: Faster taste stats
Goal: a repeat profile visit makes no TMDB call for a movie it already fetched, using a per-movie cache that honors its ttl. The math in `src/lib/taste.ts` is unchanged.
Steps: fix `dataCache.set` to honor `ttl` (after JT answers the VISTA-3 question), cache movie details by id, and test both with fake timers and a mocked `getMovieDetails`. Name the tests so they contain movie_cache.
May touch: src/lib/cache.ts, src/hooks/useRatings.ts, src/lib/__tests__/**
Done check: `bash scripts/clean-check.sh --min-tests 42 --require movie_cache --require calculateTasteMatch`
If blocked: if JT says leave the cache bug alone, cache without a custom ttl.

### PLANNED VISTA-11: Finish or remove push
Goal: per JT's answer to brief question 3, either a documented sender exists or the app stops collecting push tokens.
Steps: written in WEEK PREP once JT answers.
May touch: src/lib/pushNotifications.ts, app/_layout.tsx, src/lib/__tests__/**
Done check: `bash scripts/clean-check.sh --min-tests 43 --require push_`
If blocked: needs JT's answer to brief question 3.

### PLANNED VISTA-12: CI for pull requests
Goal: a GitHub Actions workflow runs `bash scripts/clean-check.sh` on every pull request, with Node 22 and no secrets.
Steps: write `.github/workflows/check.yml` and test that it exists and calls the clean-check script. Name it so it contains ci_workflow.
May touch: .github/workflows/check.yml, src/lib/__tests__/**
Done check: `bash scripts/clean-check.sh --min-tests 44 --require ci_workflow`
If blocked: if Actions minutes on a private repo are a cost, ask JT first.
