import Sun from "./main";
import createModel from "./utils/createModel";
import Mongoose, {Schema, Model} from "mongoose";
import ObjectId = Mongoose.Types.ObjectId;
import Document from './classes/Document.class'
import User, {processUserSchemaDeclaration} from './classes/User.class'
import Connection from './classes/Connection.class'
import {Secret} from 'jsonwebtoken'
import readHTMLFile from './utils/readHTMLFile'
import mailTo from './utils/mailTo'
import getModel from './utils/getModel'

import getUserFromToken from './session/utils/getUserFromToken';
import getTokenFromUser from './session/utils/getTokenFromUser';

import { Response, Request } from "./types";

import log from './utils/log'

export * from "./types"

import {hash} from './utils/hash'
import {jwt} from './utils/jwt'

import safeUser from "./session/utils/safeUser"

export {
    createModel,
    ObjectId,
    Response,
    Request,
    Schema,
    Model,
    Sun,
    Document,
    User,
    Connection,
    processUserSchemaDeclaration,
    log,
    getModel,
    readHTMLFile,
	mailTo,
	hash,
	jwt,
	Secret,
    safeUser,
    getUserFromToken,
    getTokenFromUser
};

export default Sun