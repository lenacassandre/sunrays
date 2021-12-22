import { FilterQuery, Document as MongooseDocument } from "mongoose";
import Document from "../classes/Document.class";
import User from "../classes/User.class";

import { Method, ModelDeclaration, Request, Response, RepoControllersArgumentsTypes, RepoControllersReturnTypes } from "../types";

import log from "../utils/log";

/**
 *
 * @param modelDeclaration
 * @returns
 */
export function remove<UserType extends User, DocType extends Document>(
	modelDeclaration: ModelDeclaration<UserType, DocType>
) {
    return async (
		req: Request<UserType, RepoControllersArgumentsTypes<DocType>["remove"]>,
		res: Response<RepoControllersReturnTypes<DocType>["remove"]>
    ) => {
        // Si aucune permission de suppression est donnée. On renvoit une erreur.
        if(!modelDeclaration.permissions.remove) {
            return res.reject("No remove permission given.")
        }

        // La liste de tous les documents dont sunrays aura accepté la suppression
        const removedIds: string[] = [];


        const queryFilter: FilterQuery<MongooseDocument<DocType>> = {removed: {$ne: true}}; // $ne: not equal.

        // Les non superadmin ne peuvent accéder qu'à leur organisation
        if(req.connection.user && !req.connection.user.roles.includes("superadmin")) {
            if (req.connection.organization) {
                queryFilter.organizations = req.connection.organization;
            }
            else {
                return res.reject("Erreur organisations.")
            }
        }

        log.debug("queryFilter", queryFilter)

        // On demande à mongoose tous les documents à supprimer
        const docsToRemove = await modelDeclaration.model.find(queryFilter)
            .where("_id")
            .in(req.body)
            .lean<DocType>()
            .exec()

        log.debug("docsToRemove", docsToRemove)

        // @ts-ignore
        for(const currentDoc of docsToRemove) {
            try {
                log.debug("currentDoc", currentDoc)

				// Vérifie que l'utilisateur a le droit de supprimmer/restaurer ce document
                let isRemoveAuthorized = await modelDeclaration.permissions.remove(currentDoc, req.connection.user);

                log.debug("isRemoveAuthorized", isRemoveAuthorized)

                if(isRemoveAuthorized) {
                    // Archivage du document
                    //@ts-ignore je sais pas pourquoi il y a une erreur...
                    await modelDeclaration.model.findByIdAndUpdate(currentDoc._id, {removed: true});

                    // On enregistre que la modification ait bien été faite.
                    removedIds.push(currentDoc._id);
                }
            }
            catch(e) {
                log.error(`Error in ${modelDeclaration.name}/remove en appelant ${modelDeclaration.name}.permissions.remove.`, e); // Une erreur s'est produite.
                return res.reject("Erreur."); // On renvoie un tableau vide au client.
            }

        }

        if(removedIds.length > 0) {
            res.resolve(removedIds); // On renvoie le tableau de toutes les modifications qui ont été acceptées.
            res.dispatch<DocType, "remove">(modelDeclaration.name, "remove", removedIds); // On envoie le résultat aux autres clients
        } else {
            res.reject("Non autorisé.");
        }
	}
}
