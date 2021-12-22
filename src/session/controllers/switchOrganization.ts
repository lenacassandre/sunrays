import getUserFromToken from "../utils/getUserFromToken";
import { Request, Response, SafeUser } from "../../types";
import { User } from "../..";
import safeUser from "../utils/safeUser";


export default async function switchOrganization<UserType extends User>(
	req: Request<UserType, string>,
	res: Response<void>
) {
	try {
        req.connection.switchOrganization(req.body);
        res.resolve()
	} catch (error) {
		return res.reject("Session invalide. Essayez de vous reconnecter.");
	}
}
