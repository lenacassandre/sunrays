import socketIo from "socket.io";
import { User } from "..";
import {SafeUser} from '../types'

export default class SocketConnection<UserType extends User>{
    socket: socketIo.Socket;
    user: SafeUser<UserType> | null;
    shortId: string;

    constructor(socket: socketIo.Socket, shortId: string) {
        this.socket = socket;
        this.user = null;
        this.shortId = shortId;
    }

    connectUser(user: SafeUser<UserType>) {
        this.user = user
    }

    disconnectUser() {
        this.user = null;
    }
}