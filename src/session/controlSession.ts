import login from "./controllers/login";
import logout from "./controllers/logout";
import verify from "./controllers/verify";
import switchOrganization from "./controllers/switchOrganization";

// Pour tous les utilisateurs connectés, on écoute les methodes de gestion d'utilisateurs/session
export default function controlSession() {
	return {
		"connection/login": login,
		"connection/logout": logout,
		"connection/verify": verify,
		"connection/switchOrganization": switchOrganization
	}
}

