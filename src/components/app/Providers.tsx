import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { AchievementsEffects } from "./AchievementsEffects";
import { AuthEffects } from "./AuthEffects";
import { FlagPrecacheEffects } from "./FlagPrecacheEffects";
import { GameEffects } from "./GameEffects";
import { NetworkEffects } from "./NetworkEffects";
import { ThemeEffects } from "./ThemeEffects";

export default function Providers({ children }: { children: ReactNode }) {
	return (
		<Provider store={store}>
			<ThemeEffects />
			<AuthEffects />
			<NetworkEffects />
			<GameEffects />
			<AchievementsEffects />
			<FlagPrecacheEffects />
			{children}
		</Provider>
	);
}
