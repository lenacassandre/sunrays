import { FilterQuery, Document as MongooseDocument } from "mongoose";

import { model } from "mongoose";
import Connection from "../classes/Connection.class";
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
    getConnections: () => Connection<"socket", UserType>[], // La liste de toutes les connections Socket
    getModelsDeclarations: () => ModelDeclaration<UserType, any>[], // La liste de toutes les factories actuellement enregistrées sur l'app.
    authorConnection: Connection<any, UserType>, // L'utilisateur•ice qui a demandé la mutation
    date: Date,
    repositoryName: string, // La factory qui a été sauvegardée
    controllerType: ControllerType, // Type de mutation. Classique ou personnalisé.
    data: RepoControllersReturnTypes<DocType>[ControllerType], // Les données de la mutation
) {
    const connections = getConnections();
    const modelsDeclarations = getModelsDeclarations();

    const modelDeclaration = modelsDeclarations.find(md => md.name === repositoryName);

    if(!Array.isArray(data)) {
        return log.error("dispatchChanges. data must be an array.")
    }

    if(!modelDeclaration) {
        return log.error(`dispatchChanges. Aucune déclaration de modèle "${repositoryName}" trouvée.`)
    }

    if(data.length === 0) {
        return log.warn(`dispatchChanges. Aucune données envoyées.`)
    }

    if(!modelDeclaration.permissions.request) {
        return log.warn(`dispatchChanges. modelDeclaration.permissions.request is undefined`)
    }

    // doc ou id, DocType | string
    const dataType = getDataType(controllerType);

    // @ts-ignore ça marche. Pas le temps de typer correctement. Liste des ids des documents qui ont été touchés.
    const ids: string[] = dataType === "id" ? data : data.map(d => d._id)

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Renvoie un query filter mongoDB en fonction de l'utilisateur
    const getQueryFilter = async (connection: Connection<any, UserType>) => {
        let queryFilter: FilterQuery<MongooseDocument<DocType>>;

        if(modelDeclaration.permissions.requestFilter)  {
            queryFilter = await modelDeclaration.permissions.requestFilter(connection.user);
        }
        else {
            queryFilter = {};
        }

        // Les non superadmin ne peuvent accéder qu'à leur organisation
        if(connection.user && !connection.user.roles.includes("superadmin")) {
            const orgas = connection.user.organizations || [];

            if(modelDeclaration.name === "organization") {
                //@ts-ignore
                queryFilter._id = {$in: [...orgas]}
            }
            else {
                //@ts-ignore
                queryFilter.organizations = {$in: [...orgas]}
            }
        }

        // @ts-ignore
        queryFilter._id = {$in: [...ids]}

        return queryFilter
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////

    log.debug("REMOTE CHANGES 1")

    // pour les logs
    let count = 0;

    for(const connection of connections) {
        log.debug("REMOTE CHANGES 2")
        if(!authorConnection.socket || connection.socket.id !== authorConnection.socket.id) { // On n'envoie pas les données à la connexion qui est à l'origine du dispatch
            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////:::
            // VERIFIE QUE L'UTILISATEUR A ACCES AUX CHANGEMENT QUI VIENNENT D'ETRE EFFECTUES
            log.debug("REMOTE CHANGES 3")

            // TODO : permettre le remoteChanges de destroy. C'est pour l'instant impossible puisque les doc sont suppr avec qu'on fasse le dispatch changes, donc impossible d'utiliser les fonctions de permission. Gros refactor à faire...
            const queryFilter = await getQueryFilter(connection)

            log.debug("REMOTE CHANGE IDS", ids)

            // Get all modified docs
            const modifiedDocs: DocType[] = await modelDeclaration.model.find(queryFilter).lean().exec();

            log.debug("REMOTE CHANGE modifiedDocs", modifiedDocs)

            if(!Array.isArray(modifiedDocs)) break;

            // Tableau de données qui sera envoyé à l'utilisateur. Peut être un tableau d'id ou un tableau d'objets
            const dataToSend: (string | (Partial<DocType> & {_id: string}))[] = []

            for(const doc of modifiedDocs) {
                log.debug("REMOTE CHANGE doc", doc)

                const authorizedData = await modelDeclaration.permissions.request(doc, connection.user);

                log.debug("REMOTE CHANGE authorizedData", authorizedData)

                // Le document est accessible par l'utilisateur
                if(authorizedData) {
                    // Pour les controlleur qui renvoient des ids. archive, destroy, remove, restore, unarchive
                    if(dataType === "id") {
                        //@ts-ignore
                        dataToSend.push(doc._id)
                    }
                    // Pour les controlleurs qui renvoient des objets. post et patch
                    else {
                        //@ts-ignore
                        const objectToSend: (Partial<DocType> & {_id: string}) = {_id: doc._id};

                        log.debug("REMOTE CHANGE data", data)

                        // Trouve l'objet post ou patch de la requête qui correspond au document autorisé
                        // @ts-ignore ...
                        const dataObject: DocType | undefined = [...data].find(o => doc._id.equals(o._id))

                        log.debug("REMOTE CHANGE dataObject", dataObject)

                        // Si l'objet est trouvé
                        if(dataObject) {
                            for(let key in dataObject) {
                                log.debug("REMOTE CHANGE key", key)

                                // Obligée de faire ça pour TS...
                                const docKey: keyof DocType = key as keyof DocType;

                                if(key in authorizedData) {
                                    log.debug("REMOTE CHANGE dataObject[docKey]", dataObject[docKey])

                                    // @ts-ignore flemme
                                    objectToSend[docKey] = dataObject[docKey];
                                }
                            }
                        }

                        dataToSend.push(objectToSend)
                    }
                }
            }

            connection.socket.emit("remoteChanges", {
                author: authorConnection.user ? {
                    _id: authorConnection.user._id,
                    userName: authorConnection.user.userName,
                } : null,
                date,
                repositoryName,
                controllerType,
                data: dataToSend
            });

            count++;
        }
    }

    if(count > 0) log.dispatch(`${repositoryName}/${controllerType}`, count);
}