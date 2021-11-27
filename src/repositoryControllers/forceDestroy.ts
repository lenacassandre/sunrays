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
export function forceDestroy<UserType extends User, DocType extends Document>(
	modelDeclaration: ModelDeclaration<UserType, DocType>
) {
    return async (
		req: Request<UserType, RepoControllersArgumentsTypes<DocType>["destroy"]>,
		res: Response<RepoControllersReturnTypes<DocType>["destroy"]>
	) => {
		try {
			if(!modelDeclaration.permissions.remove) {
				return res.reject("No remove permission given.")
			}

			// Liste des ids détruits.
			const destroyedIds: string[] = []

			const queryFilter: FilterQuery<MongooseDocument<DocType>> = {};

			// Les non superadmin ne peuvent accéder qu'à leur organisation
			if(req.connection.user && !req.connection.user.roles.includes("superadmin")) {
				const orgas = req.connection.user.organizations || [];

				//@ts-ignore
				queryFilter.organizations = {$in: [...orgas]}
			}

			// Liste des documents à détruire.
			const docsToDelete = await modelDeclaration.model.find(queryFilter)
				.where("_id")
				.in(req.body)
				.lean<DocType>()
				.exec()

			// @ts-ignore
			for(const doc of docsToDelete) {
				try {
					let authorizedDelete = await modelDeclaration.permissions.remove(doc, req.connection.user);

					if(authorizedDelete) {
						const destroyedDoc = await modelDeclaration.model.findOneAndDelete({_id: doc._id});

						if(destroyedDoc) {
							destroyedIds.push(doc._id);
						}
					}
				}
				catch(e) {
					log.error(`Error in ${modelDeclaration.name}/destroy en appelant ${modelDeclaration.name}.permissions.delete.`, e); // Une erreur s'est produite.
					return res.reject("Erreur."); // On renvoie un tableau vide au client.
				}
			}

			if(destroyedIds.length > 0) {
				res.resolve(destroyedIds)
				res.dispatch<DocType, "destroy">(modelDeclaration.name, "destroy", destroyedIds); // On envoie le résultat aux autres clients
			} else {
				res.reject("Non autorisé.")
			}
		}
		catch(e) {
			log.error(`Error in ${modelDeclaration.name}/destroy.`, e); // Une erreur s'est produite.
			return res.reject("Erreur."); // On renvoie une erreur.
		}
	}
}