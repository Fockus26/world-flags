import { OPTION_TILE_ROW, OptionTile } from "@/components/ui/OptionTile";
import { useTheme } from "@/hooks/useTheme";

const themeOptions = [
	{ value: "light", icon: "☀️", label: "Claro" },
	{ value: "dark", icon: "🌙", label: "Oscuro" },
	{ value: "system", icon: "🖥️", label: "Sistema" },
] as const;

export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();

	return (
		<div className={`${OPTION_TILE_ROW} gap-2`}>
			{themeOptions.map((option) => (
				<OptionTile
					key={option.value}
					name="settings-theme"
					value={option.value}
					checked={theme === option.value}
					onChange={() => setTheme(option.value)}
				>
					<span aria-hidden="true">{option.icon}</span> {option.label}
				</OptionTile>
			))}
		</div>
	);
}
