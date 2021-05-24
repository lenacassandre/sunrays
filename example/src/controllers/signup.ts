import { getModel, hash, jwt, log, Request, Response, safeUser } from "../../../lib";
import { User } from "../models/User.model";

export async function signup(
    req: Request<
        User,
        {
			user: {
				userName: string;
				firstName: string;
				lastName: string;
				roles: number[];
				organizations: string[]
			},
			password: string,
        }
    >,
    res: Response<{_id: string, token: string}>
) {
        if(!req.body) return res.reject("Veuillez remplir le formulaire d'inscription."); // Refuse la requête si aucune info n'est envoyée.
        if(!req.body.user) return res.reject("Veuillez remplir le formulaire d'inscription."); // Refuse la requête si aucune info n'est envoyée.
		if(!req.body.user.userName) return res.reject("Veuillez indiquer une adresse e-mail valide."); // Refuse la requête si aucune adresse e-mail n'a été fournie.
		if(!req.body.password) return res.reject("Veuillez saisir votre mot de passe."); // Refuse la requête si aucun mdp n'a été fournie.

		const UserModel = getModel<User>("user"); // Modèle mongoose des utilisateur·ices.
		const userAlreadyExists = await UserModel.exists({ userName: req.body.user.userName }); // Vérifie que l'utilisateur·ice n'existe pas déjà.

		if(userAlreadyExists) return res.reject("L'utilsateur·ice existe déjà."); // Rejette la requête si un·e utilisateur·ice existe déjà avec la même adresse e-mail.

		// On hash le mot de passe, puis on l'encrypte avec la clé secrète avant de l'enregistrer.
		const hashedPassword = hash.generate(req.body.password);

		const userDocument = new UserModel({ // Nouveau document user
			lastName: req.body.user.lastName,
			firstName: req.body.user.firstName,
			userName: req.body.user.userName,
			roles: req.body.user.roles,
			organizations: req.body.user.organizations,
			password: hashedPassword
		});

        userDocument.save((error, doc) => {
			if(error) {
				if(typeof error === "string" || Object.keys(error).length > 0) log.error(error)
				return res.reject("Erreur lors de la sauvegarde de l'utilisateur.");
			} else {

				const token = jwt.sign(req.body.user.userName); // Encrypte le userName pour créer un token et signer la session de l'utilisateur.
				//@ts-ignore TODO : différencier les types de réponse entre le resolve et le dispatch. Le dispatch post n'a pas pas besoin de oldId
				res.dispatch("user", "post", [doc]);
				res.resolve({_id: <string><unknown>doc.toObject()._id, token});
				req.connection.connectUser(safeUser<User>(<User><unknown>doc.toObject()))
			}
		}) // Sauvegarde le nouveau document user dans la BDD
}