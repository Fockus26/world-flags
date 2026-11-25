// Trailer storyboard (project-showcase skill): a guest plays two Flags cards of South America
// and leaves the session. It starts and ends on the home screen, so the loop has no jump.
// No account and no database: everything on screen is a new guest's empty progress.
//
//   node scripts/qa-local.ts --port 4310 --offline
//   node ~/.claude/skills/project-showcase/scripts/record.mjs \
//     --storyboard docs/showcase/storyboard.mjs --format phone \
//     --base http://localhost:4310 --out docs/showcase/take

export const start = "/";

const SOUTH_AMERICA = {
	ar: "Argentina",
	bo: "Bolivia",
	br: "Brasil",
	cl: "Chile",
	co: "Colombia",
	ec: "Ecuador",
	gy: "Guyana",
	py: "Paraguay",
	pe: "Perú",
	sr: "Surinam",
	uy: "Uruguay",
	ve: "Venezuela",
};

const BASE = process.env.SHOWCASE_BASE ?? "http://localhost:4310";
const ANSWER = 'input[placeholder="Escribe el nombre del país"]';

/** Not recorded: skip the first-visit tutorial and leave Flags + South America chosen. */
export async function setup(page, context) {
	// The Astro dev toolbar is not part of the product
	await context.addInitScript(() => {
		addEventListener("DOMContentLoaded", () => {
			const style = document.createElement("style");
			style.textContent = "astro-dev-toolbar{display:none!important}";
			document.head.appendChild(style);
		});
	});
	await page.goto(BASE);
	await page.getByRole("button", { name: "Saltar tutorial" }).click();
	await page.locator('button[aria-label="Qué practicar"]:visible').click();
	await page.getByRole("option", { name: "Banderas" }).click();
	await page.getByText("Sudamérica", { exact: true }).click();
	// One card played before recording: the first-flag achievement and the first level arrive
	// here, so the home screen of the first frame has the same layout as the one of the last
	const quiet = { pause: (ms) => page.waitForTimeout(ms), type: (sel, text) => page.fill(sel, text) };
	await page.getByRole("button", { name: "Comenzar práctica" }).click();
	await answerCard(page, quiet);
	await page.waitForTimeout(1500);
	await leave(page, quiet);
	await page.waitForTimeout(6000); // the achievement toast is gone
}


/** The card shows the flag as a blob with no country in the DOM: it is matched by its bytes. */
async function countryOnCard(page) {
	const code = await page.evaluate(async (codes) => {
		const img = document.querySelector('img[alt="Bandera que debes identificar"]');
		if (!img) return null;
		const shown = await (await fetch(img.src)).text();
		for (const code of codes) {
			const flag = await (await fetch(`/flags/${code}.svg`)).text();
			if (flag === shown) return code;
		}
		return null;
	}, Object.keys(SOUTH_AMERICA));
	if (!code) throw new Error("No reconozco la bandera de la tarjeta");
	return SOUTH_AMERICA[code];
}

const FLAG = 'img[alt="Bandera que debes identificar"]';

/** `previous` is the flag of the card before: the next one is answered once it has changed. */
async function answerCard(page, h, previous = "") {
	await page.locator(ANSWER).waitFor();
	await page.waitForFunction(
		([selector, last]) => {
			const img = document.querySelector(selector);
			return img?.complete && img.src !== last;
		},
		[FLAG, previous],
	);
	const name = await countryOnCard(page);
	await h.pause(500);
	await h.type(ANSWER, name, 50);
	await h.pause(300);
	const flag = await page.locator(FLAG).getAttribute("src");
	await page.getByRole("button", { name: "Comprobar" }).click();
	return flag;
}

async function leave(page, h) {
	await page.getByRole("button", { name: "Abandonar" }).click();
	await h.pause(500);
	await page.getByRole("button", { name: "Sí, abandonar" }).click();
	await page.getByRole("button", { name: "Comenzar práctica" }).waitFor();
}

export async function scene(page, h) {
	await h.pause(1000);
	await page.getByRole("button", { name: "Comenzar práctica" }).click();
	const first = await answerCard(page, h);
	await h.pause(1300);
	await answerCard(page, h, first);
	await h.pause(1300);
	await leave(page, h);
	await h.pause(500);
	// The home card comes back from a session scrolled a few pixels: back to the top, where
	// the first frame is
	await page.evaluate(() => {
		for (const el of document.querySelectorAll("section"))
			if (el.scrollTop > 0) el.scrollTo({ top: 0, behavior: "smooth" });
	});
	await h.pause(900);
}
