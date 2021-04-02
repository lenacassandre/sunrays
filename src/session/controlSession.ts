import login from "./controllers/login";
import verify from "./controllers/verify";

// Pour tous les utilisateurs connectés, on écoute les methodes de gestion d'utilisateurs/session
export default function controlSession() {
	return {
		"user/login": login,
		"user/verify": verify
	}
}

