import express from "express";
import bodyParser from "body-parser";
import { sha256 } from "js-sha256";
import jwt from "njwt";

import { CORS, loadDataFromFile, saveDataToFile } from "./commons";

const { json, urlencoded } = bodyParser;

const SECRET = 'aPd_6f-Q+5a#7s6!f5a8s';

const app = express();
app.use(urlencoded({ extended: false }));
app.use(json());
app.use(CORS);

const statuses = [
	'Submited',
	'Designated to',
	'Waiting for supply',
	'Works in progress',
	'Works completed',
	'Invoiced',
	'Closed'
];

const loadUsers = () => loadDataFromFile('data/users.json');
const saveUsers = users => saveDataToFile('data/users.json', users);

const loadDevices = () => loadDataFromFile('data/devices.json');
const saveDevices = users => saveDataToFile('data/devices.json', users);

const loadEvents = () => loadDataFromFile('data/events.json');
const saveEvents = events => saveDataToFile('data/events.json', events);

const getUserId = email => loadUsers().find(u => u.email === email)?.id;

const secure = (req, res, callback) => {
	const token = req.get('Authorization');
	if (!token || !token.startsWith('Bearer ')) {
		console.error("Invalid token: ", token);
		return res.status(403).json({ error: "Unauthorized" });
	}

	jwt.verify(token.substring(7), SECRET, (err, verifiedJwt) => {
		if (err) {
			console.error("Token error: ", err);
			res.status(403).json({ error: "Invalid token" });
		} else {
			callback(getUserId(verifiedJwt.body.email, verifiedJwt.body.role));
		}
	});
};

const generateRandomEvents = () => {
	const rand = Math.floor(Math.random() * 10);
	if (rand > 7) {
		const devices = loadDevices();
		if (devices.length <= 0) {
			console.error('No devices found');
			return;
		}
		const events = loadEvents();
		let maxId = events.reduce((max, e) => e.id > max ? e.id : max, events?.[0]?.id || 0);
		const event = {
			id: maxId + 1,
			title: 'Event ' + rand,
			deviceId: devices[Math.floor(Math.random() * devices.length)].id,
			status: {
				title: statuses[Math.floor(Math.random() * statuses.length)],
				importance: Math.floor(Math.random() * 9) + 1
			}
		};
		events.push(event);
		saveEvents(events);
	}
};

app.get('/api/events', function (_req, res) {
	generateRandomEvents();
	res.json({ events: loadEvents() });
});

app.post('/api/events', function ({ body }, res) {
	const events = loadEvents();

	let event = null;
	if (body.id) {
		const index = events.findIndex(e => e.id === parseInt(body.id));
		event = events[index];
		for (const key in body) {
			event[key] = body[key];
		}
	} else {
		let maxId = events.reduce((max, e) => e.id > max ? e.id : max, events?.[0]?.id || 0);
		event = { id: maxId + 1, ...body };
		events.push(event);
	}
	saveEvents(events);

	res.json(event);
});

app.get('/api/events/:id', function (req, res) {
	const event = loadEvents().find(e => e.id === parseInt(req.params.id));
	res.json({ event });
});

app.delete('/api/events/:id', function (req, res) {
	saveEvents(loadEvents().filter(({ id }) => id !== parseInt(req.params.id)));
	res.json({ success: 'deteled' });
});

app.get('/api/users', function (_req, res) {
	res.json({ users: loadUsers() });
});

app.get('/api/users/:id', function (req, res) {
	const user = loadUsers().find(u => u.id === parseInt(req.params.id));
	res.json({ user });
});

app.post('/api/users', function (req, res) {
	secure(req, res, (_userId, role) => {
		if (role === 'admin') {
			const { body } = req;
			const users = loadUsers();

			let user = null;
			if (body.id) {
				const index = users.findIndex(u => u.id === parseInt(body.id));
				user = users[index];
				for (const key in body) {
					if (key === 'password') {
						user[key] = sha256(body[key]);
					} else {
						user[key] = body[key];
					}
				}
			} else {
				let maxId = users.reduce((max, u) => u.id > max ? u.id : max, users?.[0]?.id || 0);
				user = { id: maxId + 1, ...body };
				if (user.password) {
					user.password = sha256(user.password);
				}
				users.push(user);
			}
			saveUsers(users);

			res.json(user);
		} else {
			res.status(403).json({ error: "Unauthorized" });
		}
	});
});

app.delete('/api/users/:id', function (req, res) {
	saveUsers(loadUsers().filter(({ id }) => id !== parseInt(req.params.id)));
	res.json({ success: 'deteled' });
});

app.get('/api/devices', function (req, res) {
	secure(req, res, () => {
		res.json({ devices: loadDevices() });
	});
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

app.post('/api/login', function ({ body }, res) {
	const users = loadUsers();

	const user = users.find(u => u.email === body.email);
	if (!user || user.password !== sha256(body.password)) {
		console.error("Invalid credentials: ", body);
		return res.status(401).json({ error: "Error" });
	}

	const token = jwt.create({ email: user.email, role: user.role }, SECRET);
	token.setExpiration(new Date().getTime() + 60 * 60 * 1000);

	res.json({ userId: user.id, role: user.role, token: token.compact() });
});

app.post('/api/sign-up', function ({ body }, res) {
	const users = loadUsers();

	const existing = users.find(u => u.email === body.email);
	if (!body.username || !body.password || !body.email || existing) {
		console.error('Invalid user data: ', body);
		return res.status(400).json({ error: "Error" });
	}

	const maxId = users.reduce((max, u) => u.id > max ? u.id : max, users?.[0]?.id || 0);
	const { password, ...others } = body;
	const user = { id: maxId + 1, password: sha256(password), ...others };
	users.push(user);

	saveUsers(users);

	delete user.password;

	res.json(user);
});

app.listen(3000, () => {
	console.log("App started");
});

export default app;
