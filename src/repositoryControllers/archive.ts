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
export function archive<UserType extends User, DocType extends Document>(
	modelDeclaration: ModelDeclaration<UserType, DocType>
) {
    return async (
		req: Request<UserType, RepoControllersArgumentsTypes<DocType>["archive"]>,
		res: Response<RepoControllersReturnTypes<DocType>["archive"]>
	) => {
        // La liste de tous les documents dont sunrays aura accepté l'archivage
        const archivedIds: string[] = [];

        // Si aucune permission d'archivage est donnée. On renvoit une erreur.
        if(!modelDeclaration.permissions.archive) {
            log.warn("No archive permission given");
            return res.reject("No archive permission given.")
        }

        const queryFilter: FilterQuery<MongooseDocument<DocType>> = {archived: {$ne: true}};

                // Les non superadmin ne peuvent accéder qu'à leur organisation
        if(req.connection.user && !req.connection.user.roles.includes(1)) {
            //@ts-ignore
            queryFilter.organization = {$in: [...(req.connection.user.organization || [])]}
        }

        // On demande à mongoose tous les documents à archiver
        const docsToPatch = await modelDeclaration.model.find(queryFilter)
            .where("_id")
            .in(req.body)
            .lean<DocType>()
            .exec()

        for(const currentDoc of docsToPatch) {
            try {
                let isArchiveAuthorized = await modelDeclaration.permissions.archive(currentDoc, req.connection.user);

                // Ok pour superadmin
                if(req.connection.user && req.connection.user.roles.includes(1)) {
                    isArchiveAuthorized = true;
                }

                if(isArchiveAuthorized) {
                    // Archivage du document
                    //@ts-ignore je sais pas pourquoi il y a une erreur...
                    await modelDeclaration.model.findByIdAndUpdate(currentDoc._id, {archived: true});

                        // On enregistre que la modification ait bien été faite.
                    archivedIds.push(currentDoc._id);
                }
            }
            catch(e) {
                log.error(`Error in ${modelDeclaration.name}/archive en appelant ${modelDeclaration.name}.permissions.archive.`, e); // Une erreur s'est produite.
                return res.reject("Erreur."); // On renvoie un tableau vide au client.
            }

        }

        if(archivedIds.length > 0) {
            res.resolve(archivedIds); // On renvoie le tableau de toutes les modifications qui ont été acceptées.
            res.dispatch<DocType, "archive">(modelDeclaration.name, "archive", archivedIds); // On envoie le résultat aux autres clients
        } else {
            res.reject("Non autorisé.");
        }
	}
}
