import { Schema, model, SchemaDefinitionProperty, SchemaOptions, Document as MongooseDocument } from "mongoose";
import User, { processUserSchemaDeclaration } from "../classes/User.class";
import Document, { processSchemaDeclaration } from "../classes/Document.class";
import { ModelDeclaration, Permissions } from "../types";
import log from "./log";

type definition = {
    [key: string]: SchemaDefinitionProperty<undefined>
}

////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

export default function createModel<UserType extends User, DocType extends Document>(
	name: string,
	definition: definition,
	permissions: Permissions<UserType, DocType>,
	mongooseSchemaOptions?: SchemaOptions
): ModelDeclaration<UserType, DocType> {
	// Ajoute les propriétés dont héritent tous les document, ou tous les users
	definition = name === "user" ? processUserSchemaDeclaration(definition) : processSchemaDeclaration(definition);

	log.debug("Creating schema", name);
	const schema = new Schema(definition, {...mongooseSchemaOptions, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

	log.debug("Creating model", name);
	const Model = model<MongooseDocument<DocType>>(name, schema);

	return {name, model: Model, permissions};
}

