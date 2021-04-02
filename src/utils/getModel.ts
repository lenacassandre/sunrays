import mongoose, {Document as MongooseDocument} from 'mongoose'
import Document from '../classes/Document.class';

const getModel = <DocumentType extends Document>(modelName: string): mongoose.Model<MongooseDocument<DocumentType>> => {
    const Model = mongoose.model<MongooseDocument<DocumentType>>(modelName);
    return Model
}

export default getModel