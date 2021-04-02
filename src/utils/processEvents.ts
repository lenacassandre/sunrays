import log from "./log";

export default function processListeners() {
	// On ferme le serveur si le terminal qui s'en occupe se ferme.
	process.on("SIGTERM", () => {
		log.info("Fermeture du terminal...");
	});

	// Message
	process.on("message", (message) => {
		log.info(message);
	});

	// Warnings
	process.on("warning", ({ name, message, stack }) => {
		log.warn(name, message, stack);
	});

	// Quand une promesse est résolue ou rejetée plusieurs fois
	process.on("multipleResolves", (type, promise, reason) => {
		log.warn(type, promise, reason);
	});

	// PROMISE REJECTED HAVING NO CATCH
	// Pour pouvoir repérer facilement les promesses qui sont mal suivies (qui n'ont pas de catch)
	process.on("unhandledRejection", (reason, promise) => {
		console.log("Unhandled Rejection at:", promise, "reason:", reason);
		// Application specific logging, throwing an error, or other logic here
	});
}
