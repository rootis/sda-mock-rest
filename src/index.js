import express from "express";
import bodyParser from "body-parser";

import { CORS, crud, crudSecure, enableSecurity, getOneSecure, removeSecure } from "./commons";

const { json, urlencoded } = bodyParser;

const app = express();
app.use(urlencoded({ extended: false }));
app.use(json());
app.use(CORS);

enableSecurity(app, (60 * 60 * 1000));
crud(app, 'people');

// To secure all CRUD:
// crudSecure(app, 'resources');

// To secure some endpoints
// getOneSecure(app, 'resources');
// removeSecure(app, 'resources');
// crud(app, 'test');

app.listen(3000, () => {
    console.log("App started");
});

export default app;
