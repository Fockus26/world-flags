/**
 * PR screenshots — generates PNGs of the states the unit changed.
 *
 * Usage (with **node**, not bun — see the note below):
 *   node scripts/pr-screenshots.ts .pr-shots.json   (= bun run shots)   # Node ≥ 23.6 (or 22.x with --experimental-strip-types)
 *   → writes .pr-shots/<name>[-light|-dark].png and lists the paths.
 *   Then: bun run shots:publish   (= bash scripts/publish-pr-shots.sh .pr-shots)
 *
 * `.pr-shots.json` is written by the agent for its unit — rewritten each time, never reused
 * from the previous unit (and it is in .gitignore). The server URL goes in `base`:
 *
 *   {
 *     "base": "http://localhost:3000",
 *     "shots": [
 *       { "name": "ranking-mobile", "path": "/", "width": 375, "height": 812, "scheme": "both",
 *         "storage": { "tutorial-seen": "1" },
 *         "steps": [ { "click": "role=button[name='Ver ranking']" },
 *                    { "waitFor": "role=dialog" } ],
 *         "element": "role=dialog" },
 *       { "name": "home-desktop", "path": "/", "width": 1280, "height": 800 }
 *     ]
 *   }
 *
 * Fields of each shot:
 *   width/height   viewport (default 1280×800)
 *   scheme         "light" | "dark" | "both" (default "light")
 *   storage        localStorage keys seeded before loading (to reach a state)
 *   steps          click | fill+value | press | waitFor | wait (ms) | eval (JS in the page)
 *   element        captures only that element (sharper and lighter than the page)
 *   fullPage       whole page instead of the viewport
 *
 * Decisions that avoid bad or hanging screenshots:
 *   - Service workers blocked: an old cached bundle is never captured.
 *   - `reducedMotion: 'reduce'`: no photos halfway through an animation.
 *   - Timeout per step and one retry per shot; if it still fails, it goes on with the
 *     others and reports at the end (a failing shot does not block the PR).
 *
 * **Why node and not bun:** on Windows, Playwright launched from a Bun script hangs starting
 * Chromium (checked: 170 s without output with bun; 3 shots in seconds with node, same
 * script). Applies to every script that imports Playwright. `package.json` scripts
 * (`bun run test:e2e` → `playwright test`) do not have the problem: Playwright's binary runs
 * with node through its shebang.
 *
 * The agent **does not open the images** to review them (they cost many tokens): it already
 * verified by measuring the DOM. The screenshots are for whoever reviews the PR.
 */

import { chromium, type Page } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";

type Step =
	| { click: string }
	| { fill: string; value: string }
	| { press: string }
	| { waitFor: string }
	| { wait: number }
	| { eval: string };

type Shot = {
	name: string;
	path?: string;
	width?: number;
	height?: number;
	scheme?: "light" | "dark" | "both";
	storage?: Record<string, string>;
	steps?: Step[];
	element?: string;
	fullPage?: boolean;
};

const configPath = process.argv[2] ?? ".pr-shots.json";
const OUT = ".pr-shots";
const STEP_TIMEOUT = 10_000;

const config = JSON.parse(await readFile(configPath, "utf8")) as {
	base: string;
	shots: Shot[];
};
await mkdir(OUT, { recursive: true });

async function runSteps(page: Page, steps: Step[]) {
	for (const step of steps) {
		if ("click" in step)
			await page.locator(step.click).first().click({ timeout: STEP_TIMEOUT });
		else if ("fill" in step)
			await page
				.locator(step.fill)
				.first()
				.fill(step.value, { timeout: STEP_TIMEOUT });
		else if ("press" in step) await page.keyboard.press(step.press);
		else if ("waitFor" in step)
			await page
				.locator(step.waitFor)
				.first()
				.waitFor({ timeout: STEP_TIMEOUT });
		else if ("wait" in step) await page.waitForTimeout(step.wait);
		else if ("eval" in step) await page.evaluate(step.eval);
	}
}

const browser = await chromium.launch({ args: ["--disable-gpu"] });
const written: string[] = [];
const failed: string[] = [];

for (const shot of config.shots) {
	const schemes =
		shot.scheme === "both"
			? (["light", "dark"] as const)
			: ([shot.scheme ?? "light"] as const);

	for (const scheme of schemes) {
		const file = `${OUT}/${shot.name}${shot.scheme === "both" ? `-${scheme}` : ""}.png`;

		for (let attempt = 1; attempt <= 2; attempt++) {
			const context = await browser.newContext({
				viewport: { width: shot.width ?? 1280, height: shot.height ?? 800 },
				colorScheme: scheme,
				reducedMotion: "reduce",
				serviceWorkers: "block",
				deviceScaleFactor: 1,
			});
			if (shot.storage) {
				await context.addInitScript((entries: Record<string, string>) => {
					for (const [k, v] of Object.entries(entries))
						localStorage.setItem(k, v);
				}, shot.storage);
			}
			const page = await context.newPage();
			try {
				await page.goto(config.base + (shot.path ?? "/"), {
					waitUntil: "load",
					timeout: 30_000,
				});
				await runSteps(page, shot.steps ?? []);
				if (shot.element) {
					await page
						.locator(shot.element)
						.first()
						.screenshot({ path: file, timeout: STEP_TIMEOUT });
				} else {
					await page.screenshot({
						path: file,
						fullPage: shot.fullPage ?? false,
						timeout: STEP_TIMEOUT,
					});
				}
				written.push(file);
				await context.close();
				break;
			} catch (error) {
				await context.close();
				if (attempt === 2)
					failed.push(`${file} — ${(error as Error).message.split("\n")[0]}`);
			}
		}
	}
}

await browser.close();

console.log(
	`Screenshots written (${written.length}):\n  ${written.join("\n  ") || "—"}`,
);
if (failed.length)
	console.log(
		`\nCould not be taken (${failed.length}):\n  ${failed.join("\n  ")}`,
	);
process.exit(written.length === 0 && failed.length > 0 ? 1 : 0);
