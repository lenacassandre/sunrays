import { Request, Response, Omit, SafeUser } from "../../types";
import getTokenFromUser from "../utils/getTokenFromUser";
import passwordHash from "password-hash";
import log from "../../utils/log";
import User from '../../classes/User.class'
import mongoose from "mongoose";
import safeUser from '../utils/safeUser'
import { hash } from "../../utils/hash"
import { Secret } from "jsonwebtoken"
import getModel from "../../utils/getModel";

export default async function logout<UserType extends User>(
	req: Request<UserType, void>,
	res: Response<void>
) {
	try {
        req.connection.logout()
	} catch (e) {
		if (typeof e === "string") {
			return res.reject(e);
		} else {
			log.error(e)
			return res.reject("Erreur de connexion.");
		}
	}
}
