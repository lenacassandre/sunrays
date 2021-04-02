import { User } from "../..";
import { Omit } from '../../types'

export default function safeUser<UserType extends User>(user: UserType): Omit<UserType, "password"> & {hasPassword: boolean} {
    return {
        ...user,
        hasPassword: user.password && user.password.length > 0 ? true : false,
        password: undefined,
    }
}