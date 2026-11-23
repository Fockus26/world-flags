import { useState } from "react";
import { WorldMap } from "@/components/game/map/WorldMap";
import { Button } from "@/components/ui/Button";
import { countries } from "@/data/countries";
import { type PracticeRegion, REGION_LABELS, REGIONS } from "@/types/country";

const NAME_BY_CODE = new Map(countries.map(({ code, name }) => [code, name]));

/**
 * Banco de pruebas de `WorldMap` (`/mapa-lab`, solo con `MAP_LAB=1`): tocar un
 * país lo marca como acertado, y los botones vuelan a cada continente. No es
 * parte de la app: se quita cuando exista el modo Mapa.
 */
export function MapLab() {
	const [foundCodes, setFoundCodes] = useState<ReadonlySet<string>>(new Set());
	const [region, setRegion] = useState<PracticeRegion>("world");
	const [lastSelected, setLastSelected] = useState<string>();

	const focusCodes =
		region === "world"
			? undefined
			: countries
					.filter((country) => country.region === region)
					.map(({ code }) => code);

	const toggle = (code: string) => {
		setLastSelected(code);
		setFoundCodes((previous) => {
			const next = new Set(previous);
			if (!next.delete(code)) next.add(code);
			return next;
		});
	};

	const setTheme = (theme: "light" | "dark") => {
		document.documentElement.dataset.theme = theme;
	};

	return (
		<main id="main-content" className="flex h-dvh flex-col gap-2 p-2">
			<h1 className="sr-only">Laboratorio del mapa</h1>
			<div className="flex flex-wrap gap-1">
				{(["world", ...REGIONS] as const).map((option) => (
					<Button
						key={option}
						fullWidth={false}
						color="primary"
						variant={option === region ? "contained" : "soft"}
						pressed={option === region}
						onClick={() => setRegion(option)}
					>
						{REGION_LABELS[option]}
					</Button>
				))}
				<Button
					fullWidth={false}
					color="neutral"
					variant="outline"
					onClick={() =>
						setFoundCodes(new Set(countries.map(({ code }) => code)))
					}
				>
					Pintar todos
				</Button>
				<Button
					fullWidth={false}
					color="neutral"
					variant="outline"
					onClick={() => setFoundCodes(new Set())}
				>
					Limpiar
				</Button>
				<Button
					fullWidth={false}
					color="neutral"
					variant="outline"
					onClick={() => setTheme("light")}
				>
					Claro
				</Button>
				<Button
					fullWidth={false}
					color="neutral"
					variant="outline"
					onClick={() => setTheme("dark")}
				>
					Oscuro
				</Button>
			</div>
			<p data-testid="last-selected" className="text-caption text-text">
				Último tocado:{" "}
				{lastSelected ? NAME_BY_CODE.get(lastSelected) : "ninguno"} ·{" "}
				{foundCodes.size} pintados
			</p>
			<div className="min-h-0 flex-1">
				<WorldMap
					label="Mapa del mundo"
					foundCodes={foundCodes}
					focusCodes={focusCodes}
					onSelect={toggle}
					getCountryLabel={(code) => NAME_BY_CODE.get(code)}
				/>
			</div>
		</main>
	);
}
