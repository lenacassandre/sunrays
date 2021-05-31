import { FilterQuery, Document as MongooseDocument } from "mongoose";
import Document from "../classes/Document.class";
import User from "../classes/User.class";

import { Method, ModelDeclaration, RepoControllersArgumentsTypes, RepoControllersReturnTypes, Request, Response } from "../types";

import log from "../utils/log";

/**
 *
 * @param modelDeclaration
 * @returns
 */
export function patch<UserType extends User, DocType extends Document>(
	modelDeclaration: ModelDeclaration<UserType, DocType>
) {
    return async (
		req: Request<UserType, RepoControllersArgumentsTypes<DocType>["patch"]>,
		res: Response<RepoControllersReturnTypes<DocType>["patch"]>
	) => {
		if(!modelDeclaration.permissions.patch) {
			return res.reject("No patch permission given.")
		}

		try {
			const queryFilter: FilterQuery<MongooseDocument<DocType>> = {
				archived: {$ne: true},
				removed: {$ne: true}
			};

			// Les non superadmin ne peuvent accéder qu'à leur organisation
			if(req.connection.user && !req.connection.user.roles.includes(1)) {
				//@ts-ignore
				queryFilter.organization = {$in: [...(req.connection.user.organization || [])]}
			}

			const docsIdsToFind = req.body.map(doc => doc._id);

			const docsToPatch = await modelDeclaration.model.find(queryFilter)
				.where("_id")
				.in(docsIdsToFind)
				.lean<DocType>()
				.exec()

			// Le tableau de toutes modifications qui ont été acceptées.
			const patches: (Partial<DocType> & {_id: string})[] = [];

			for(const currentDoc of docsToPatch) {
				const patch = req.body.find(p => p._id === currentDoc._id.toString())

				if(patch) {
					try {
						let authorizedPatch = await modelDeclaration.permissions.patch(currentDoc, patch, req.connection.user);

						if(authorizedPatch) {
							// On verrouille certaines modifications
							delete authorizedPatch.archived
							delete authorizedPatch.removed
							delete authorizedPatch._id

							// Pour les users, si l'utilisateur n'est pas superadmin, on l'empêche d'intéragir avec le rôle superadmin
							if(modelDeclaration.name === "user") {
								// @ts-ignore
								if(authorizedPatch.roles) {
									// @ts-ignore
									authorizedPatch.roles = authorizedPatch.roles.filter(r => r !== 1)
								}
							}

							if(authorizedPatch.organizations) {
								log.debug("Prevent superadmin role injection.");

								// @ts-ignore
								authorizedPatch.organizations = authorizedPatch.organizations.filter(orgaId => req.connection.user?.organizations.includes(orgaId));
							}
						}

						if(authorizedPatch) {
							authorizedPatch._id = currentDoc._id
							const patchClone: any = {...authorizedPatch}
							delete patchClone._id

							await modelDeclaration.model.findByIdAndUpdate(authorizedPatch._id, patchClone); // On retire l'ID.

							patches.push(<(Partial<DocType> & {_id: string})>authorizedPatch); // On enregistre que la modification ait bien été faite.
						}
					}
					catch(e) {
						log.error(`Error in ${modelDeclaration.name}/patch en appelant ${modelDeclaration.name}.permissions.patch.`, e); // Une erreur s'est produite.
						return res.reject("Erreur."); // On renvoie un tableau vide au client.
					}
				}
			}

			if(patches.length > 0) {
				res.resolve(patches); // On renvoie le tableau de toutes les modifications qui ont été acceptées.
				res.dispatch<DocType, "patch">(modelDeclaration.name, "patch", patches); // On envoie le résultat aux autres clients
			} else {
				res.reject("Non autorisé.");
			}
		}
		catch(e) {
			log.error(`Error in ${modelDeclaration.name}/patch.`, e); // Une erreur s'est produite.
			return res.reject("Erreur."); // On renvoie une erreur.
		}
	}
}