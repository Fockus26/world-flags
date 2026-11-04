/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly PUBLIC_VAPID_PUBLIC_KEY: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
