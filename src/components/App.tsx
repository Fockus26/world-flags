import { ErrorBoundary } from "./app/ErrorBoundary";
import Providers from "./app/Providers";
import FlagGame from "./game/FlagGame";

export default function App() {
	return (
		<ErrorBoundary>
			<Providers>
				<FlagGame />
			</Providers>
		</ErrorBoundary>
	);
}
