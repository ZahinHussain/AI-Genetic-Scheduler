// This is a temporary solution for development only!
// Install cors-anywhere package:
// npm install cors-anywhere

const corsAnywhere = require("cors-anywhere");

const host = process.env.HOST || "0.0.0.0";
const port = 8081;

corsAnywhere
  .createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: ["origin", "x-requested-with"],
    removeHeaders: ["cookie", "cookie2"],
  })
  .listen(port, host, function () {
    console.log("CORS Anywhere proxy running on " + host + ":" + port);
  });

// Then update your frontend code to use this proxy:
// const apiUrl = `http://localhost:8081/http://${baseUrlHost}:${baseUrlPort}/recurringtasks`;
