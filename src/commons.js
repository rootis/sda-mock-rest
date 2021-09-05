import fs from 'fs';

export const CORS = (
  _req,
  res,
  next
) => {
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

const loadDataFromFile = file => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
const saveDataToFile = (file, data) => fs.writeFileSync(file, JSON.stringify(data));

const getAll = (app, resourceName) => {
  app.get(`/api/${resourceName}`, function (_req, res) {
    res.json({ data: loadDataFromFile(`data/${resourceName}.json`) });
  });
};

const getOne = (app, resourceName) => {
  app.get(`/api/${resourceName}/:id`, function (req, res) {
    res.json({ data: loadDataFromFile(`data/${resourceName}.json`).find(i => i.id === parseInt(req.params.id)) });
  });
};

const post = (app, resourceName) => {
  app.post(`/api/${resourceName}`, function ({ body }, res) {
    const data = loadDataFromFile(`data/${resourceName}.json`);
  
    let record = null;
    if (body.id) {
      const index = data.findIndex(i => i.id === parseInt(body.id));
      record = data[index];
      for (const key in body) {
        record[key] = body[key];
      }
    } else {
      let maxId = data.reduce((max, i) => i.id > max ? i.id : max, data?.[0]?.id || 0);
      record = { ...body, id: maxId + 1 };
      data.push(record);
    }
    saveDataToFile(`data/${resourceName}.json`, data);
  
    res.json({ data: record });
  });
};

const remove = (app, resourceName) => {
  app.delete(`/api/${resourceName}/:id`, function (req, res) {
    saveDataToFile(`data/${resourceName}.json`, loadDataFromFile(`data/${resourceName}.json`).filter(({ id }) => id !== parseInt(req.params.id)));
    res.json({ success: 'deteled' });
  });
};
