import {jwt} from '../../utils/jwt'
import log from "../../utils/log";
import { User } from "../..";

export default function getTokenFromUser<UserType extends User>(user: UserType) {
	try {
		const token = jwt.sign(user.userName);

		if (token) {
			return token;
		} else {
			log.warn("Utilisateur non trouvé");
		}
	} catch (e) {
		log.error("GetTokenFromUser Error");
		log.error(e);
	}
}
