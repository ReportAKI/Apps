export default function pocketbaseAuthPlugin() {
	return {
		name: 'vite:pocketbase-auth',
		apply: 'serve',
		transformIndexHtml() {
			const script = `
                const ALLOWED_PARENT_ORIGINS = [
                    "https://reportaki.app.com",
                    "https://reportaki.app.dev",
                    "https://reportaki-frontend-local.app.dev",
                ];
                const getParentOrigin = () => {
                    if (
                        window.location.ancestorOrigins &&
                        window.location.ancestorOrigins.length > 0
                    ) {
                        return window.location.ancestorOrigins[0];
                    }

                    if (document.referrer) {
                        try {
                            return new URL(document.referrer).origin;
                        } catch (e) {
                            console.warn("Invalid referrer URL:", document.referrer);
                        }
                    }

                    return null;
                };
                    
                    
                    
                window.addEventListener("message", function (event) {
                    const parentOrigin = getParentOrigin();

                    if (event.data?.type === "database_preview_auth" && parentOrigin && ALLOWED_PARENT_ORIGINS.includes(parentOrigin)) {
                        localStorage.setItem("__pb_superuser_auth__", event.data.value);
                    }
                });
            `;

			return [
				{
					tag: 'script',
					attrs: { type: 'module' },
					children: script,
					injectTo: 'head'
				}
			];
		}
	};
}
