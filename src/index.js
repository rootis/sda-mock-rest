import express from "express";
import { json, urlencoded } from "body-parser";
import { sha256 } from "js-sha256";
import jwt from "njwt";

import { CORS, loadDataFromFile, saveDataToFile } from "./commons";

const SECRET = 'aPd_6f-Q+5a#7s6!f5a8s';

const app = express();
app.use(urlencoded({ extended: false }));
app.use(json());
app.use(CORS);

const loadUsers = () => loadDataFromFile('data/users.json');
const saveUsers = users => saveDataToFile('data/users.json', users);

const loadMovies = () => loadDataFromFile('data/movies.json');

const loadUserMovies = () => loadDataFromFile('data/user-movies.json');
const saveUserMovies = movies => saveDataToFile('data/user-movies.json', movies);

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
			callback(getUserId(verifiedJwt.body.email));
		}
	});
};

app.get('/api/movies', function (_req, res) {
	res.json({ movies: loadMovies() });
});

app.get('/api/my-movies', function (req, res) {
	secure(req, res, userId => {
		const userMovies = loadUserMovies();

		if (!userMovies[userId] || Object.keys(userMovies[userId]).length <= 0) {
			return res.json({ movies: [] });
		}

		res.json({ movies: loadMovies().filter(m => userMovies[userId][m.id]) });
	});
});

app.post('/api/my-movies/:movieId', function (req, res) {
	secure(req, res, userId => {
		const userMovies = loadUserMovies();
		
		if (!userMovies[userId]) {
			userMovies[userId] = {};
		}

		userMovies[userId][req.params.movieId] = true;
		saveUserMovies(userMovies);
		
		res.json({ success: "saved" });
	});
});

app.delete('/api/my-movies/:movieId', function (req, res) {
	secure(req, res, userId => {
		const userMovies = loadUserMovies();
		
		if (!userMovies[userId]) {
			userMovies[userId] = {};
		}

		delete userMovies[userId][req.params.movieId];
		saveUserMovies(userMovies);
		
		res.json({ success: "removed" });
	});
});

app.post('/api/login', function ({ body }, res) {
	const users = loadUsers();

	const user = users.find(u => u.email === body.email);
	if (!user || user.password !== sha256(body.password)) {
		console.error("Invalid credentials: ", body);
		return res.status(401).json({ error: "Error" });
	}

	const token = jwt.create({ email: user.email }, SECRET);
	token.setExpiration(new Date().getTime() + 60 * 60 * 1000);

	res.json({ userId: user.id, token: token.compact() });
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
