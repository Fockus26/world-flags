import type { DailyReminderResult } from "@/utils/push-notifications";

/**
 * Resultados de activar el recordatorio que se explican a quien juega en vez
 * de cerrarse en silencio (D127). Los comparten el aviso tras la primera
 * partida y el interruptor de Configuración.
 */
export type ExplainedDailyReminderResult = Exclude<
	DailyReminderResult,
	"subscribed" | "dismissed"
>;

export interface DailyReminderExplanation {
	emoji: string;
	title: string;
	body: string;
	/** Si tiene sentido volver a intentarlo sin salir de la app. */
	canRetry: boolean;
}

// Los textos de por qué no se activó el recordatorio y cómo arreglarlo.
export const DAILY_REMINDER_EXPLANATIONS: Record<
	ExplainedDailyReminderResult,
	DailyReminderExplanation
> = {
	denied: {
		emoji: "🔕",
		title: "Las notificaciones están bloqueadas",
		body: "Este navegador no deja que Banderas del Mundo te mande avisos. Para activarlos, abre los permisos del sitio (el icono junto a la dirección web), permite las notificaciones y vuelve a intentarlo.",
		canRetry: true,
	},
	failed: {
		emoji: "⚠️",
		title: "No pudimos activar el recordatorio",
		body: "Algo falló al guardar el aviso en este dispositivo. Inténtalo de nuevo en un momento.",
		canRetry: true,
	},
	"ios-needs-install": {
		emoji: "📲",
		title: "Instala la app para recibir avisos",
		body: "En iPhone y iPad los avisos solo funcionan con Banderas del Mundo instalada: en Safari, toca Compartir y luego «Añadir a pantalla de inicio», y ábrela desde ahí.",
		canRetry: false,
	},
	"insecure-context": {
		emoji: "🔒",
		title: "Los avisos necesitan una conexión segura",
		body: "El navegador solo permite avisos en páginas con https. Abre Banderas del Mundo desde su dirección segura para activarlos.",
		canRetry: false,
	},
	unsupported: {
		emoji: "🔕",
		title: "Este navegador no permite avisos",
		body: "Puedes activar el recordatorio desde otro navegador o dispositivo.",
		canRetry: false,
	},
};
