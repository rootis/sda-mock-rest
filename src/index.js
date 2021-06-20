import express from "express";
import { json, urlencoded } from "body-parser";
import fs from 'fs';

import { CORS } from "./commons";

const app = express();
app.use(urlencoded({ extended: false }));
app.use(json());
app.use(CORS);

const getPeople = () => JSON.parse(fs.readFileSync('data/people.json'));
const savePeople = people => fs.writeFileSync('data/people.json', JSON.stringify(people));

app.get('/api/people', function (_req, res) {
    res.json({ people: getPeople() });
});

app.get('/api/people/:id', function (req, res) {
	const person = getPeople().find(p => p.id === parseInt(req.params.id));
    res.json({ person });
});

app.post('/api/people', function (req, res) {
	const people = getPeople();
	if (req.body.id) {
		const index = people.findIndex(p => p.id === parseInt(req.body.id));
		const person = people[index];
		for (const key in req.body) {
			person[key] = req.body[key];
		}
		res.json(person);
	} else {
		let maxId = people.reduce((max, p) => p.id > max ? p.id : max, people[0].id);
		const person = { id: maxId + 1, ...req.body };
		people.push(person);
		res.json(person);
	}
	savePeople(people);
});

app.delete('/api/people/:id', function (req, res) {
    savePeople(getPeople().filter(({ id }) => id !== parseInt(req.params.id)));
    res.json({ success: 'deteled' });
});

app.listen(3000, () => {
    console.log("App started");
});

export default app;
