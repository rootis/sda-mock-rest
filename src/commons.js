import fs from "fs";
import { sha256 } from "js-sha256";
import jwt from "njwt";

const SECRET = process.argv[0];

export const CORS = (_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "*");
  next();
};

export const crud = (app, resourceName) => {
  getAll(app, resourceName);
  getOne(app, resourceName);
  remove(app, resourceName);
  post(app, resourceName);
};

export const crudSecure = (app, resourceName) => {
  getAllSecure(app, resourceName);
  getOneSecure(app, resourceName);
  removeSecure(app, resourceName);
  postSecure(app, resourceName);
};

export const enableSecurity = (app, expiration) => {
  login(app, expiration);
  signUp(app);
};

const loadDataFromFile = (file) =>
  fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
const saveDataToFile = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data));

const getAll = (app, resourceName) => {
  app.get(`/api/${resourceName}`, function (_req, res) {
    res.json({ data: loadDataFromFile(`data/${resourceName}.json`) });
  });
};

export const getAllSecure = (app, resourceName) => {
  app.get(`/api/${resourceName}`, function (req, res) {
    secure(req, res, () => {
      res.json({ data: loadDataFromFile(`data/${resourceName}.json`) });
    });
  });
};

const getOne = (app, resourceName) => {
  app.get(`/api/${resourceName}/:id`, function (req, res) {
    res.json({
      data: loadDataFromFile(`data/${resourceName}.json`).find(
        (i) => i.id === parseInt(req.params.id)
      ),
    });
  });
};

export const getOneSecure = (app, resourceName) => {
  app.get(`/api/${resourceName}/:id`, function (req, res) {
    secure(req, res, () => {
      res.json({
        data: loadDataFromFile(`data/${resourceName}.json`).find(
          (i) => i.id === parseInt(req.params.id)
        ),
      });      
    });
  });
};

const post = (app, resourceName) => {
  app.post(`/api/${resourceName}`, function ({ body }, res) {
    const data = loadDataFromFile(`data/${resourceName}.json`);

    let record = null;
    if (body.id) {
      const index = data.findIndex((i) => i.id === parseInt(body.id));
      record = data[index];
      for (const key in body) {
        record[key] = body[key];
      }
    } else {
      let maxId = data.reduce(
        (max, i) => (i.id > max ? i.id : max),
        data?.[0]?.id || 0
      );
      record = { ...body, id: maxId + 1 };
      data.push(record);
    }
    saveDataToFile(`data/${resourceName}.json`, data);

    res.json({ data: record });
  });
};

export const postSecure = (app, resourceName) => {
  app.post(`/api/${resourceName}`, function (req, res) {
    const { body } = req;
    secure(req, res, () => {
      const data = loadDataFromFile(`data/${resourceName}.json`);

      let record = null;
      if (body.id) {
        const index = data.findIndex((i) => i.id === parseInt(body.id));
        record = data[index];
        for (const key in body) {
          record[key] = body[key];
        }
      } else {
        let maxId = data.reduce(
          (max, i) => (i.id > max ? i.id : max),
          data?.[0]?.id || 0
        );
        record = { ...body, id: maxId + 1 };
        data.push(record);
      }
      saveDataToFile(`data/${resourceName}.json`, data);
  
      res.json({ data: record });      
    });
  });
};

const remove = (app, resourceName) => {
  app.delete(`/api/${resourceName}/:id`, function (req, res) {
    saveDataToFile(
      `data/${resourceName}.json`,
      loadDataFromFile(`data/${resourceName}.json`).filter(
        ({ id }) => id !== parseInt(req.params.id)
      )
    );
    res.json({ success: "deteled" });
  });
};

export const removeSecure = (app, resourceName) => {
  app.delete(`/api/${resourceName}/:id`, function (req, res) {
    secure(req, res, () => {
      saveDataToFile(
        `data/${resourceName}.json`,
        loadDataFromFile(`data/${resourceName}.json`).filter(
          ({ id }) => id !== parseInt(req.params.id)
        )
      );
      res.json({ success: "deteled" });
    });
  });
};

const loadUsers = () => loadDataFromFile("data/users.json");
const saveUsers = (users) => saveDataToFile("data/users.json", users);
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

const login = (app, expiration) => {
  app.post("/api/login", function ({ body }, res) {
    const users = loadUsers();

    const user = users.find((u) => u.email === body.email);
    if (!user || user.password !== sha256(body.password)) {
      console.error("Invalid credentials: ", body);
      return res.status(401).json({ error: "Error" });
    }

    const token = jwt.create({ email: user.email }, SECRET);
    token.setExpiration(new Date().getTime() + expiration);

    res.json({ userId: user.id, token: token.compact() });
  });
};

const signUp = (app) => {
  app.post("/api/sign-up", function ({ body }, res) {
    const users = loadUsers();

    const existing = users.find((u) => u.email === body.email);
    if (!body.username || !body.password || !body.email || existing) {
      console.error("Invalid user data: ", body);
      return res.status(400).json({ error: "Error" });
    }

    const maxId = users.reduce(
      (max, u) => (u.id > max ? u.id : max),
      users?.[0]?.id || 0
    );
    const { password, ...others } = body;
    const user = { id: maxId + 1, password: sha256(password), ...others };
    users.push(user);

    saveUsers(users);

    delete user.password;

    res.json(user);
  });
};
