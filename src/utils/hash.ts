import passwordHash from "password-hash"
import { jwt } from './jwt'

/**
 * hash permet de protéger les mots de passe des utilisateur·ices en les hashant,
 * puis en les encodant avec la clé secrète.
 */
export const hash = {
	/**
	 * Génère un mot de passe hashé et encrypté pour le sauvegarder en toute sécurité.
	 * @param password Le mot de passe pur de l'utilisateur·ice.
	 * @param secret La clé secrète permettant d'encrypter. Cela peut-être n'importe quoi. De préférence une longue string écrite dans les variables d'environnement.
	 */
	generate: (password: string) => {
		const hashedPassword = passwordHash.generate(password); // hash le mot de passe envoyé.
		const encryptedHashedPassword = jwt.sign(hashedPassword); // Encrypte le mot de passe hashé avec la clé secrète.
		return encryptedHashedPassword;
	},
	/**
	 * Vérifie que le mot de passe pur envoyé est valide.
	 * @param password Le mot de passe pur de l'utilisateur·ice.
	 * @param savedHashedPasswordToken Le mot de passe encrypté par hash.generate.
	 * @param secret La clé secrète permettant d'encrypter. Cela peut-être n'importe quoi. De préférence une longue string écrite dans les variables d'environnement.
	 */
	verify: (password: string, encryptedHashedPassword: string) => {
		const hashedSavedPassword = jwt.verify(encryptedHashedPassword); // Décrypte le mot de passe encrypté avec la clé secrète. Le mot de passe est toujorus hashé.

		if(typeof hashedSavedPassword === "string") {
			const arePasswordsEquals = passwordHash.verify(password, hashedSavedPassword); // On vérifie que le hash du mot de passe envoyé est égal au mot de passe hashé sauvegardé.
			return arePasswordsEquals;
		}

		return false;

	}
}