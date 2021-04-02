import getUserFromToken from "../utils/getUserFromToken";
import { Request, Response, SafeUser } from "../../types";
import { User } from "../..";
import safeUser from "../utils/safeUser";

export default async function verify<UserType extends User>(
	req: Request<UserType, {token: string}>,
	res: Response<{user: SafeUser<UserType>}>
) {
	try {
		if(!req.data) return res.reject("Session invalide. Essayez de vous reconnecter.");

		const user = await getUserFromToken<UserType>(req.data.token);

		if (user) {
			const userResult = safeUser<UserType>(user); // On retire le mot de passe du résultat.

			req.connection.connectUser(userResult); // On enregistre l'utilisateur•ice dans la connection socket afin que les controlleurs suivant puissent y accéder rapidement.

			return res.resolve({user: userResult}); // Envoie de la réponse.
		} else {
			return res.reject("Session invalide. Essayez de vous reconnecter.");
		}
	} catch (error) {
		return res.reject("Session invalide. Essayez de vous reconnecter.");
	}
}
