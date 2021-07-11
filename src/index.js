import express from "express";
import { json, urlencoded } from "body-parser";
import fs from 'fs';

import { CORS, loadDataFromFile, saveDataToFile } from "./commons";

const app = express();
app.use(urlencoded({ extended: false }));
app.use(json());
app.use(CORS);

const loadUsers = () => loadDataFromFile('data/users.json');
const saveUsers = users => saveDataToFile('data/users.json', users);

const loadDevices = () => loadDataFromFile('data/devices.json');
const saveDevices = users => saveDataToFile('data/devices.json', users);

app.get('/api/users', function (_req, res) {
    res.json({ users: loadUsers() });
});

app.get('/api/users/:id', function (req, res) {
	const user = loadUsers().find(u => u.id === parseInt(req.params.id));
    res.json({ user });
});

app.post('/api/users', function ({ body }, res) {
	const users = loadUsers();

	let user = null;
	if (body.id) {
		const index = users.findIndex(u => u.id === parseInt(body.id));
		user = users[index];
		for (const key in body) {
			user[key] = body[key];
		}
	} else {
		let maxId = users.reduce((max, u) => u.id > max ? u.id : max, users?.[0]?.id || 0);
		user = { id: maxId + 1, ...body };
		users.push(user);
	}
	saveUsers(users);

	res.json(user);
});

app.delete('/api/users/:id', function (req, res) {
    saveUsers(loadUsers().filter(({ id }) => id !== parseInt(req.params.id)));
    res.json({ success: 'deteled' });
});

app.get('/api/devices', function (_req, res) {
    res.json({ devices: loadDevices() });
});

app.get('/api/devices/:id', function (req, res) {
	const device = loadDevices().find(d => d.id === parseInt(req.params.id));
    res.json({ device });
});

app.post('/api/devices', function ({ body }, res) {
	const devices = loadDevices();

	let device = null;
	if (body.id) {
		const index = devices.findIndex(d => d.id === parseInt(body.id));
		device = devices[index];
		for (const key in body) {
			device[key] = body[key];
		}
	} else {
		let maxId = devices.reduce((max, d) => d.id > max ? d.id : max, devices?.[0]?.id || 0);
		device = { id: maxId + 1, ...body };
		devices.push(device);
	}
	saveDevices(devices);

	res.json(device);
});

app.delete('/api/devices/:id', function (req, res) {
    saveDevices(loadDevices().filter(({ id }) => id !== parseInt(req.params.id)));
    res.json({ success: 'deteled' });
});

app.listen(3000, () => {
    console.log("App started");
});

export default app;
