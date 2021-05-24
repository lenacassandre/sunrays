import { FilterQuery, Document as MongooseDocument } from "mongoose";
import Document from "../classes/Document.class";
import User from "../classes/User.class";

import { PermissionType, Method, ModelDeclaration, RepoControllersArgumentsTypes, RepoControllersReturnTypes, RepoControllerType, Request, Response, } from "../types";

import log from "../utils/log";

/**
 * Génère un controlleur de repo. Cette fonction a pour but de réunir toutes les étapes redondantes des controlleurs.
 * @param modelDeclaration
 * @returns
 */
/*
export function baseRepoController<UserType extends User, DocType extends Document, Type extends RepoControllerType>(
	modelDeclaration: ModelDeclaration<UserType, DocType>,
    controllerType: Type,
    permissionType: PermissionType,
    queryFilter: FilterQuery<MongooseDocument<DocType>>,
    dispatch?: boolean
): Method<UserType, any, any> {
    return async (
		req: Request<UserType, RepoControllersArgumentsTypes<DocType>[Type]>,
		res: Response<RepoControllersReturnTypes<DocType>[Type]>
	) => {
        // Tableau contenant toutes les données à renvoyer au client
        const result: RepoControllersReturnTypes<DocType>[Type] = [];

        // Si aucune permission n'est donnée. On renvoit une erreur.
        if(!modelDeclaration.permissions[permissionType]) {
            return res.reject(`No ${controllerType} permission given.`)
        }

        // FILTER
        // Les non superadmin ne peuvent accéder qu'à leur structure
        if(req.connection.user && !req.connection.user.roles.includes(1)) {
            //@ts-ignore
            queryFilter.organization = {$in: req.connection.user.organization}
        }

        // FIND
        // On demande à mongoose tous les documents à archiver
        const documents = await modelDeclaration.model.find(queryFilter)
            .where("_id")
            .in(req.body)
            .lean<DocType>()
            .exec()

        for(const doc of documents) {
            try {
                const isAuthorized = await modelDeclaration.permissions[permissionType](req.connection.user, currentDoc);

                if(isArchiveAuthorized) {
                    // Archivage du document
                    //@ts-ignore je sais pas pourquoi il y a une erreur...
                    await modelDeclaration.model.findByIdAndUpdate(currentDoc._id, {archived: true});

                        // On enregistre que la modification ait bien été faite.
                    result.push(currentDoc._id);
                }
            }
            catch(e) {
                log.error(`Error in ${modelDeclaration.name}/archive en appelant ${modelDeclaration.name}.permissions.archive.`, e); // Une erreur s'est produite.
                return res.reject("Erreur."); // On renvoie un tableau vide au client.
            }
        }

        if(result.length > 0) {
            res.resolve(result); // On renvoie le tableau de toutes les modifications qui ont été acceptées.
            dispatch && res.dispatch<DocType, Type>(modelDeclaration.name, controllerType, result); // On envoie le résultat aux autres clients
        } else {
            res.reject("Unauthorized.");
        }
	}
}*/