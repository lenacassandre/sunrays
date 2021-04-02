import { model } from "mongoose";
import { SocketConnection } from "..";
import Document from "../classes/Document.class";
import User from "../classes/User.class";
import safeUser from "../session/utils/safeUser";
import {ModelDeclaration, SafeUser} from '../types'
import log from '../utils/log';

/**
 * Renvoie tous les changement effectué par un client, à tous les clients qui doivent voir les
 * résultats, sauf celui qui en est l'origine.
 * Ne supporte que les mutations "classiques" (post, patch et delete)
 */
export default async function dispatchChanges<UserType extends User, DocType extends Document>(
    getConnections: () => SocketConnection<UserType>[], // La liste de toutes les connections Socket
    getModelsDeclarations: () => ModelDeclaration<UserType, any>[], // La liste de toutes les factories actuellement enregistrées sur l'app.
    authorConnection: SocketConnection<UserType>, // L'utilisateur•ice qui a demandé la mutation
    date: Date,
    factoryName: string, // La factory qui a été modifiée
    type: "post" | "patch" | "delete", // Type de mutation. Classique ou personnalisé.
    data: Partial<DocType>[], // Les données de la mutation
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

    let count = 0;

    for(const connection of connections) {
        if(connection.socket.id !== authorConnection.socket.id) { // On n'envoie pas les données à la connexion qui est à l'origine du dispatch
            let dataToSend = []

            for(const doc of data) {
                const authorizedData = await modelDeclaration.permissions.request(connection.user, doc);

                if(authorizedData) {
                    dataToSend.push({...authorizedData, _id: doc._id})
                }
            }

            // Delete n'a besoin que des ids
            if(type === "delete") {
                dataToSend = dataToSend.map(doc => doc._id)
            }

            connection.socket.emit("remoteChanges", {
                author: authorConnection.user ? {
                    _id: authorConnection.user._id,
                    userName: authorConnection.user.userName,
                } : null,
                date,
                factoryName,
                type,
                data: dataToSend
            });

            count++;
        }
    }

    if(count > 0) log.dispatch(`${factoryName}/${type}`, count);
}