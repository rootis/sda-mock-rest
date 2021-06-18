export const CORS = (
  _req,
  res,
  next
) => {
  res.header("Access-Control-Allow-Origin", "localhost");
  res.header("Access-Control-Allow-Headers", "*");
  next();
};
