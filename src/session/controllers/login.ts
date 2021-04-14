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

export default async function login<UserType extends User>(
	req: Request<UserType, { userName: string; password: string }>,
	res: Response<{token: string; user: SafeUser<UserType>}>
) {
	try {
		if(!req.data) return res.reject("Veuilez saisir votre adresse e-mail et votre mot de passe.");
		if (!req.data.userName) return res.reject("Veuilez saisir votre adresse e-mail.");
		if (!req.data.password) return res.reject("Veuillez saisir votre mot de passe.");

		const UserModel = getModel<UserType>("user")
		const user = <UserType>await UserModel.findOne({ userName: req.data.userName }).lean<UserType>();

		if (user) {
			const isPasswordCorrect = hash.verify(req.data.password, user.password)

			if (isPasswordCorrect) {
				const token = getTokenFromUser(user);

				if (token) {
					const userResult: SafeUser<UserType> = safeUser(user); // Sécurise le mot de passe
					req.connection.connectUser(userResult); // Enregistre la connection sur le runtime du serveur

					return res.resolve({ token, user: userResult }); // Login OK
				} else {
					return res.reject("Erreur lors de la création de la session.");
				}
			} else {
				return res.reject("Mot de passe incorrect.");
			}
		} else {
			return res.reject("Adresse e-mail invalide.");
		}
	} catch (e) {
		if (typeof e === "string") {
			return res.reject(e);
		} else {
			return res.reject("Erreur de connexion. " + JSON.stringify(e));
		}
	}
}
