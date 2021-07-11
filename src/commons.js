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

export const loadDataFromFile = file => JSON.parse(fs.readFileSync(file));
export const saveDataToFile = (file, data) => fs.writeFileSync(file, JSON.stringify(data));
