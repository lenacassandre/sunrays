import { FilterQuery, Document as MongooseDocument } from "mongoose";
import Document from "../classes/Document.class";
import User from "../classes/User.class";

import {  Method, ModelDeclaration, Request, Response, RepoControllersArgumentsTypes, RepoControllersReturnTypes } from "../types";

import log from "../utils/log";

/**
 *
 * @param modelDeclaration
 * @returns
 */
export function restore<UserType extends User, DocType extends Document>(
	modelDeclaration: ModelDeclaration<UserType, DocType>
) {
    return async (
		req: Request<UserType, RepoControllersArgumentsTypes<DocType>["restore"]>,
		res: Response<RepoControllersReturnTypes<DocType>["restore"]>
	) => {
        // La liste de tous les documents dont sunrays aura accepté la restauration
        const restoreIds: string[] = [];

        // Si aucune permission de restauration est donnée. On renvoit une erreur.
        if(!modelDeclaration.permissions.remove) {
            log.warn("No remove permission given");
            return res.reject("No remove permission given.")
        }

        const queryFilter: FilterQuery<MongooseDocument<DocType>> = {removed: true};

        // Les non superadmin ne peuvent accéder qu'à leur organisation
        if(req.connection.user && !req.connection.user.roles.includes(1)) {
            //@ts-ignore
            queryFilter.organization = {$in: [...(req.connection.user.organization || [])]}
        }

        // On demande à mongoose tous les documents à restaurer
        const docsToPatch = await modelDeclaration.model.find(queryFilter)
            .where("_id")
            .in(req.body)
            .lean<DocType>()
            .exec()

        for(const currentDoc of docsToPatch) {
            try {
				// Vérifie que l'utilisateur a le droit de supprimmer/restaurer ce document
                let isRestoreAuthorized = await modelDeclaration.permissions.remove(currentDoc, req.connection.user);

                // Ok pour superadmin
				if(req.connection.user && req.connection.user.roles.includes(1)) {
					isRestoreAuthorized = true;
				}

                if(isRestoreAuthorized) {
                    // Archivage du document
                    //@ts-ignore je sais pas pourquoi il y a une erreur...
                    await modelDeclaration.model.findByIdAndUpdate(currentDoc._id, {removed: false});

                    // On enregistre que la modification ait bien été faite.
                    restoreIds.push(currentDoc._id);
                }
            }
            catch(e) {
                log.error(`Error in ${modelDeclaration.name}/remove en appelant ${modelDeclaration.name}.permissions.remove.`, e); // Une erreur s'est produite.
                return res.reject("Erreur."); // On renvoie un tableau vide au client.
            }
        }

        if(restoreIds.length > 0) {
            res.resolve(restoreIds); // On renvoie le tableau de toutes les modifications qui ont été acceptées.
            res.dispatch<DocType, "restore">(modelDeclaration.name, "restore", restoreIds); // On envoie le résultat aux autres clients
        } else {
            res.reject("Non autorisé.");
        }
	}
}
