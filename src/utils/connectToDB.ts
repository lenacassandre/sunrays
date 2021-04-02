import mongoose, { Error } from "mongoose";

export default function connectToDB(URL: string, callback: (err: Error) => void) {
	mongoose.set("useFindAndModify", false);
	mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true }, callback);
}
