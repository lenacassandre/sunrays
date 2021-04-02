import jsonwebtoken, { Secret } from 'jsonwebtoken';

/**
 * hash permet de protéger les mots de passe des utilisateur·ices en les hashant,
 * puis en les encodant avec la clé secrète.
 */
export const jwt = {
    /**
     * Renvoie un token de session à partir du userName (unique).
     * @param userName
     */
	sign: (userName: string): string => {
		const token = jsonwebtoken.sign(userName, <Secret>process.env.SECRET);
		return token;
	},
	/**
     * Renvoie le userName de l'utilisateur•ice à partir de son token de session.
     * @param token
     */
	verify: (token: string): string => {
		const userName = <string>jsonwebtoken.verify(token, <Secret>process.env.SECRET);
		return userName;
	}
}