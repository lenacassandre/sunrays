import socketIo from "socket.io";
import { getModel, User } from "..";
import safeUser from "../session/utils/safeUser";
import {SafeUser} from '../types'
import Promise from "true-promise"
import { FilterQuery, Document as MongooseDocument, Mongoose, connection } from "mongoose";
import { filterInPlace } from "../session/utils/filterInPlace";

type ConnectionType = "http" | "socket";

export default class Connection<C extends ConnectionType, U extends User>{
    type: C; // socket | http. Les connection de type socket sont persistentes alors que les http sont ponctuelles.
    user?: SafeUser<U>; // L'utilisateur si il est authentifié
    socket: C extends "socket" ? socketIo.Socket : undefined; // La connection socket.io
    shortId: C extends "socket" ? string : undefined; // Un id raccouci de socket.io (uniquement pour les logs)
    organization?: string; // A connection must be attached to one organization

    // @ts-ignore VALIDE. "Les membres statiques ne peuvent pas référencer des paramètres de type de classe." - Si. Puisque la valeur statique est la référence du tableau.
    static all: Connection<"socket", U>[] = []; // All current socket connections on the app

    constructor(type: C, socket?: C extends "socket" ? socketIo.Socket : undefined) {
        if (type === "socket") {
            // @ts-ignore VALIDE. On vérifie le type juste avant
            Connection.all.push(this);
        }

        this.type = type;

        //@ts-ignore VALIDE.
        this.socket = socket;

        // @ts-ignore VALIDE.
        this.shortId = socket?.id.slice(0, 5);
    }

    // TODO : améliorer les comportements en cas d'échec, par exemple si on ne réussi pas à se connecter à l'orga
    public login(user: U | SafeUser<U>) {
        this.user = safeUser<U>(user);

        // Relie la connection à la dernière organisation à laquelle l'utilisateur c'était connecté.
        if (this.user.currentOrganization && this.user.organizations.includes(this.user.currentOrganization)) {
            this.organization = this.user.currentOrganization;
        }
    }

    public logout() {
        delete this.user;
        delete this.organization;
    }

    // TODO : améliorer les comportements en cas d'échec, par exemple si on ne réussi pas à se connecter à l'orga
    public switchOrganization(organizationId: string) {
        return new Promise((resolve, reject) => {
            if (this.user?.organizations.includes(organizationId)) {
                // On change l'orga de cette instance

                // On ne change pas l'orga de toutes les connections actives de l'utilisateurs. C'est un choix.
                this.organization = organizationId;
                this.user.currentOrganization = organizationId;

                // On change l'orga actuelle de l'utilisateur enregistrée dans la BDD
                const UserModel = getModel("user");
                UserModel.findByIdAndUpdate(this.user._id, { currentOrganization: organizationId })
            }
        })
    }

    /**
     * Remove this instance from runtime (supposed to delete it via the garbage collector)
     */
    public close() {
        // Remove this instance from the array
        filterInPlace<Connection<"socket", U>>(Connection.all, (connection => connection.shortId !== this.shortId));
    }

    public reset() {
        this.socket?.emit("reset");
    }
}