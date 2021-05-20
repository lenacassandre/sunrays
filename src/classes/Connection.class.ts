import socketIo from "socket.io";
import { User } from "..";
import safeUser from "../session/utils/safeUser";
import {SafeUser} from '../types'

type ConnectionType = "http" | "socket";

export default class Connection<C extends ConnectionType, U extends User>{
    type: C; // socket | http
    user?: SafeUser<U>;
    socket: C extends "socket" ? socketIo.Socket : undefined;
    shortId: C extends "socket" ? string : undefined;

    constructor(type: C, socket?: C extends "socket" ? socketIo.Socket : undefined) {
        this.type = type;

        //@ts-ignore
        this.socket = socket;

        //@ts-ignore
        this.shortId = socket?.id.slice(0, 5);
    }

    connectUser(user: U | SafeUser<U>) {
        this.user = safeUser<U>(user)
    }

    disconnectUser() {
        delete this.user;
    }
}