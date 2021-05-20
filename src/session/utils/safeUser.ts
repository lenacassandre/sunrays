import { User } from "../..";
import { Omit, SafeUser } from '../../types'

export default function safeUser<U extends User>(user: U | SafeUser<U>): SafeUser<U> {
    return {
        ...user,
        hasPassword: "hasPassword" in user
            ? user.hasPassword
            : user.password && user.password.length > 0
            ? true
            : false,
        password: undefined,
    }
}