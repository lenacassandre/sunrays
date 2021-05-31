import { FilterQuery, Document as MongooseDocument } from "mongoose";
import Document from "../classes/Document.class";
import User from "../classes/User.class";
import safeUser from "../session/utils/safeUser";

import { Method, ModelDeclaration, RepoControllersArgumentsTypes, RepoControllersReturnTypes, Request, Response } from "../types";

import log from "../utils/log";

/**
 *
 * @param modelDeclaration
 * @returns
 */
export function getArchives<UserType extends User, DocType extends Document>(
	modelDeclaration: ModelDeclaration<UserType, DocType>
) {
    return async (
		req: Request<UserType, RepoControllersArgumentsTypes<DocType>["getArchives"]>,
		res: Response<RepoControllersReturnTypes<DocType>["getArchives"]>
	) => {
		try {
			if(!modelDeclaration.permissions.request) {
				return res.reject("No request permission given.");
			}

			// Le query object mongoose
			let queryFilter: FilterQuery<MongooseDocument<DocType>> = {};

			// Si un requestFilter est déclaré, on le récupère
			if(modelDeclaration.permissions.requestFilter) {
				queryFilter = await modelDeclaration.permissions.requestFilter(req.connection.user); // Demande un query filter pour accélérer la requête
			}

			// Si le requestFilter a renvoyé null, la requête est refusée, on renvoie un tableau vide
			if(queryFilter === null) {
				return res.reject("Non autorisé"); // On renvoi un tableau vide.
			}

			// La requête getArchives ne renvoie les document archivés mais pas les documents supprimés
			//@ts-ignore
			queryFilter.removed = {$ne: true};
			//@ts-ignore
			queryFilter.archived = true;

			// Les non superadmin ne peuvent accéder qu'à leur organisation
			if(req.connection.user && !req.connection.user.roles.includes(1)) {
				//@ts-ignore
				queryFilter.organization = {$in: [...(req.connection.user.organization || [])]}
			}

			////////////////////////////////////////////////////////////////////////////////////////////////
			// Demande à mongoose de renvoyer les documents sous la forme d'objets JS purs (lean), avec le query Filter
			modelDeclaration.model.find(queryFilter).lean<DocType>().exec(async (err: any, docs: DocType[]) => { // On recherche les document demandée par le queryFilter
				if(err) { // Si mongosse a envoyé une erreur, la requête a échoué, on renvoi un tableau vide
					log.error(`Error in ${modelDeclaration.name}/getArchives.`, err); // Une erreur inconnue s'est produite.
					return res.reject("Erreur."); // On retourne un tableau vide
				}

				// La requête a réussi. On a tous les documents en fonction du query filter. Il reste un autre tri à effectuer.
				else {
					const result: (Partial<DocType> & {_id: string})[] = []; // Le tableau qui contient tous les objects qu'on va envoyer au client.

					for(const doc of docs) { // Pour tous les documents que mongoogse a trouvé.
						try {
							if(modelDeclaration.permissions.request) {
								// La fonction de permission renvoie un objet pur contenant uniquement les propriétés que l'ont souhaite faire passer
								let docObject: any = await modelDeclaration.permissions.request(doc, req.connection.user);

								if(docObject) { // Si un objet a été retourné, on l'ajoute au tableau des résultats.
									// Empêche d'envoi de le hash des mots de passe si le repo est celui des utilisateurs. À la place, envoie une propriété "hasPassword" si le mot de passe est non nul.
									if(modelDeclaration.name === "user") {
										docObject = safeUser<UserType>(<UserType><unknown>docObject);
									}

									docObject._id = doc._id; // L'ID doit obligatoirement être envoyé
									result.push(<(Partial<DocType> & {_id: string})>docObject)
								}
							}
						}
						catch(e) {
							log.error(`Error in ${modelDeclaration.name}/getArchives en appelant ${modelDeclaration.name}.permissions.request.`, e); // Une erreur s'est produite.
						}
					}

					res.resolve(result); // On envoie le résultat au client.
				}
			})
		}
		catch(e) {
			log.error(`Error in ${modelDeclaration.name}/getArchives.`, e); // Une erreur s'est produite.
			return res.reject(""); // On renvoie un tableau vide au client.
		}
	}
}