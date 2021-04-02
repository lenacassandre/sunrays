import getModel from '../../utils/getModel'
import {jwt} from '../../utils/jwt'
import log from "../../utils/log";
import User from '../../classes/User.class'

export default function getUserFromToken<UserType extends User>(token: string): Promise<UserType> {
	return new Promise(async (resolve, reject) => {
		try {
			const UserModel = getModel<UserType>("user");

			const userName = jwt.verify(token);
			const user = <UserType>await UserModel.findOne({ userName }).lean<UserType>();

			if (user) {
				resolve(user);
			} else {
				reject("Utilisateur non trouvé")
			}
		} catch (e) {
			log.error(e);
			reject("GetUserFromToken Error");
		}
	})

}
