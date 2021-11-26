import Sun from 'sunrays';
import { signup } from './controllers/signup';
import {User, Organization, Plant} from './models/';

const app = new Sun("<mongodbConnectionString>", 3001,{
    cors: {
        origin: "*"
    }
});

app.use("user/signup", signup);
app.use(User)
app.use(Organization)
app.use(Plant)