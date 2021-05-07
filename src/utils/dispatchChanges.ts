import { FilterQuery, Document as MongooseDocument } from "mongoose";

import { model } from "mongoose";
import { SocketConnection } from "..";
import Document from "../classes/Document.class";
import User from "../classes/User.class";
import safeUser from "../session/utils/safeUser";
import {ModelDeclaration, RepoControllersReturnTypes, RepoControllerType, SafeUser} from '../types'
import log from '../utils/log';

const getDataType = (controllerType: RepoControllerType) => controllerType === "patch" || controllerType === "post" ? "doc" : "id";

/**
 * Renvoie tous les changement effectué par un client, à tous les clients qui doivent voir les
 * résultats, sauf celui qui en est l'origine.
 * Ne supporte que les mutations "classiques" (post, patch et delete)
 */
export default async function dispatchChanges<UserType extends User, DocType extends Document, ControllerType extends RepoControllerType>(
    getConnections: () => SocketConnection<UserType>[], // La liste de toutes les connections Socket
    getModelsDeclarations: () => ModelDeclaration<UserType, any>[], // La liste de toutes les factories actuellement enregistrées sur l'app.
    authorConnection: SocketConnection<UserType>, // L'utilisateur•ice qui a demandé la mutation
    date: Date,
    factoryName: string, // La factory qui a été modifiée
    controllerType: ControllerType, // Type de mutation. Classique ou personnalisé.
    data: RepoControllersReturnTypes<DocType>[ControllerType], // Les données de la mutation
) {
    const connections = getConnections();
    const modelsDeclarations = getModelsDeclarations();

    const modelDeclaration = modelsDeclarations.find(md => md.name === factoryName);

    if(!Array.isArray(data)) {
        return log.error("dispatchChanges. data must be an array.")
    }

    if(!modelDeclaration) {
        return log.error(`dispatchChanges. Aucune déclaration de modèle "${factoryName}" trouvée.`)
    }

    if(data.length === 0) {
        return log.warn(`dispatchChanges. Aucune données envoyées.`)
    }

    if(!modelDeclaration.permissions.request) {
        return log.warn(`dispatchChanges. modelDeclaration.permissions.request is undefined`)
    }

    const getQueryFilter = (connection: SocketConnection<UserType>) => {
        const queryFilter: FilterQuery<MongooseDocument<DocType>> = modelDeclaration.permissions.requestFilter ? modelDeclaration.permissions.requestFilter(connection.user) : {};

        // Les non superadmin ne peuvent accéder qu'à leur organisation
        if(connection.user && !connection.user.roles.includes(1)) {
            //@ts-ignore
            queryFilter.organization = {$in: req.connection.user.organization}
        }

        return queryFilter
    }

    const dataType = getDataType(controllerType);

    let count = 0;

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////

    for(const connection of connections) {
        if(connection.socket.id !== authorConnection.socket.id) { // On n'envoie pas les données à la connexion qui est à l'origine du dispatch
            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////:::
            // VERIFIE QUE L'UTILISATEUR A ACCES AUX CHANGEMENT QUI VIENNENT D'ETRE EFFECTUES
            const queryFilter = getQueryFilter(connection)

            // @ts-ignore ça marche. Pas le temps de typer correctement
            const ids: string[] = dataType === "id" ? data : data.map(d => d._id)

            const modifiedDocs: DocType[] = modelDeclaration.model.find(queryFilter)
                .where("_id")
                .in(ids)
                .lean<DocType>()
                .exec()

            // Tableau de données qui sera envoyé à l'utilisateur. Peut être un tableau d'id ou un tableau d'objets
            const dataToSend: (string | (Partial<DocType> & {_id: string}))[] = []

            for(const doc of modifiedDocs) {
                const authorizedData = await modelDeclaration.permissions.request(connection.user, doc);

                // Le document est accessible par l'utilisateur
                if(authorizedData) {
                    // Pour les controlleur qui renvoient des ids. archive, destroy, remove, restore, unarchive
                    if(dataType === "id") {
                        //@ts-ignore
                        dataToSend.push(doc._id)
                    }
                    // Pour les controlleurs qui renvoient des objets
                    else {
                        //@ts-ignore
                        const objectToSend: Partial<DocType> = {_id: doc._id};

                        //@ts-ignore je comprends pas ce qu'il se passe ici, sur data.find
                        const dataObject: DocType | undefined = data.find(o => o._id === doc._id)
                        if(dataObject) {
                            for(let key in dataObject) {
                                // Obligée de faire ça pour TS...
                                const docKey: keyof DocType = key as keyof DocType;

                                if(key in authorizedData) {
                                    objectToSend[docKey] = dataObject[docKey];
                                }
                            }
                        }
                    }
                }
            }

            connection.socket.emit("remoteChanges", {
                author: authorConnection.user ? {
                    _id: authorConnection.user._id,
                    userName: authorConnection.user.userName,
                } : null,
                date,
                factoryName,
                controllerType,
                data: dataToSend
            });

            count++;
        }
    }

    if(count > 0) log.dispatch(`${factoryName}/${controllerType}`, count);
}