/**
 * La cuenta que esta pestaña cree tener, en cada petición a la API. La cookie de sesión
 * es común a todas las pestañas: si otra entra con otra cuenta, esta seguiría escribiendo
 * en la nueva lo que juega creyendo estar en la suya. Con la cabecera el servidor lo
 * rechaza como sesión rechazada (`getSessionUserId`), y la pestaña se pone al día (D227).
 */
export const ACCOUNT_HEADER = "x-world-flags-account";

let account: string | null = null;

export function setRequestAccount(userId: string | null): void {
	account = userId;
}

export function accountHeaders(): Record<string, string> {
	return account ? { [ACCOUNT_HEADER]: account } : {};
}
