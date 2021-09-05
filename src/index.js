import express from "express";
import bodyParser from "body-parser";

import { CORS, crud } from "./commons";

const { json, urlencoded } = bodyParser;

const app = express();
app.use(urlencoded({ extended: false }));
app.use(json());
app.use(CORS);

crud(app, 'people');

app.listen(3000, () => {
    console.log("App started");
});

export default app;
