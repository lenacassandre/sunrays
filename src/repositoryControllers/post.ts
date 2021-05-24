import { resolveSoa } from "dns";
import Document from "../classes/Document.class";
import User from "../classes/User.class";

import { Method, ModelDeclaration, RepoControllersArgumentsTypes, RepoControllersReturnTypes, Request, Response } from "../types";

import log from "../utils/log";

/**
 *
 * @param modelDeclaration
 * @returns
 */
export function post<UserType extends User, DocType extends Document>(
	modelDeclaration: ModelDeclaration<UserType, DocType>
) {
    return async (
		req: Request<UserType, RepoControllersArgumentsTypes<DocType>["post"]>,
		res: Response<RepoControllersReturnTypes<DocType>["post"]>
	) => {
		log.debug(modelDeclaration.name, "post controller. Data array lenth :", req.body.length)

		if(!modelDeclaration.permissions.post) {
			return res.reject("No post permission given.")
		}

		log.debug("Got post persmission.")

		try {
			const newDocsObjects: RepoControllersReturnTypes<DocType>["post"] = []; // Le tableau des nouveaux documents qui auront été acceptés par le serveur. On les renverra au client.

			log.debug("Starting to loop through the data array");

			for(const newDoc of req.body) {
				log.debug("New document received", newDoc)

				if(newDoc._id) { // And temporary Id must have been provided.
					log.debug("Got temporary id", newDoc._id)

					try {
						let newDocObject = await modelDeclaration.permissions.post(newDoc, req.connection.user); // La fonction de permission va renvoyer null, ou un objet qui devra ensuite être enregistré.

						if(newDocObject) {
							log.debug("Authorized new document object", newDocObject)

							// Changement d'instance au cas où la permission a renvoyé la même
							newDocObject = {...newDocObject};

							//////////////////////////////////////////////////////////////////////////:
							// SUPERADMIN
							if(req.connection.user && req.connection.user.roles.includes(1)) {
								log.debug("superadmin");

								newDocObject = newDoc;
							}
							////////////////////////////////////////////////////////////////////////////////
							// OTHER USERS (part of an organization)
							else if(newDocObject) {
								// On verrouille certaines modifications
								delete newDocObject.archived
								delete newDocObject.removed
								delete newDocObject._id

								// /!\ Interdiction de post dans les orga si on est pas superadmin
								if(modelDeclaration.name === "organization") {
									log.warn("Post attempt in organization.");
									return res.reject("Non autorisé.");
								}

								// @ts-ignore Pour les users, si l'utilisateur n'est pas superadmin, on l'empêche d'intéragir avec le rôle superadmin
								if(modelDeclaration.name === "user") {
									//@ts-ignore
									if(newDocObject.roles) {
										log.debug("Prevent superadmin role injection.");

										// @ts-ignore
										newDocObject.roles = newDocObject.roles.filter(r => r !== 1);
									}

									// Requête refusée sur aucun rôle n'est fourni pour un utilisateur
									// @ts-ignore
									if(!newDocObject.roles || newDocObject.roles.length === 0) {
										return res.reject("Impossible de créer un utilisateur sans rôle.")
									}
								}

								if(newDocObject.organizations) {
									log.debug("Prevent superadmin role injection.");

									// @ts-ignore
									newDocObject.organizations = newDocObject.organizations.filter(orgaId => req.connection.user?.organizations.includes(orgaId));
								}

								// Requête refusée sur aucun rôle n'est fourni pour un utilisateur
								// @ts-ignore
								if(!newDocObject.roles || newDocObject.roles.length === 0) {
									return res.reject("Impossible de créer un utilisateur sans rôle.")
								}
							}

							//////////////////////////////////////////////////////////////////////////////
							// SAUVEGARDE
							log.debug("Corrected new doc object", newDocObject)


							// Suppression de l'id temporaire et sauvegarde du document
							const objectWithoutId: any = {...newDocObject};
							delete objectWithoutId._id;
							const newDocument = new modelDeclaration.model(objectWithoutId); // On crée le nouveau document mongoose.
							const savedDocument = await newDocument.save(); // On enregistre le document.

							if(!savedDocument) { // Si le document n'a pas été sauvegardé, une erreur est envoyée.
								return log.warn(`Erreur lors de la sauvegade d'un document dans ${modelDeclaration.name}/post.`)
							}

							log.debug("Document saved !", savedDocument)

							const objectResult: any = {...savedDocument.toObject() }

							log.debug("Attaching old _id to result doc", newDoc)

							objectResult._oldId = newDoc._id

							log.debug("Result document, sent back to client :", objectResult)

							newDocsObjects.push(objectResult); // On ajoute la relation entre l'ancien ID et le nouveau au tableau.
						}
					}
					catch(e) {
						log.error(`Error in ${modelDeclaration.name}/post en appelant ${modelDeclaration.name}.permissions.post.`, e); // Une erreur s'est produite.
						return res.reject("Erreur."); // On renvoie un tableau vide au client.
					}
				}
			}

			if(newDocsObjects.length > 0) {
				res.resolve(newDocsObjects); // On renvie le tableau des nouveau documents avec leur propriété _oldId pour que le client les reconnaisse.
				res.dispatch<DocType, "post">(modelDeclaration.name, "post", newDocsObjects); // On envoie le résultat aux autres clients
			} else {
				res.reject("Non autorisé")
			}
		} catch(e) {
			log.error(`Error in ${modelDeclaration.name}/post.`, e); // Une erreur s'est produite.
			return res.reject("Erreur."); // On renvoie une erreur.
		}
	}
}