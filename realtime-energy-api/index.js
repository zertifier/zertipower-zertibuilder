const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser')
const cors = require('cors');
const { dbConnection } = require("./database/config");
const rateLimit = require('express-rate-limit');
const requestIp = require('request-ip');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = YAML.load('./swagger.yaml');

//create express server:
const app = express();

//read the json from body
app.use(bodyParser.json());

//cors:
app.use(cors());

//limit requests for ip
app.use(requestIp.mw());
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // Limit each IP to 20 requests per `window`
    message: 'Ip blocked for security',
    keyGenerator: (req, res) => {
        return req.clientIp // IP address from requestIp.mw(), as opposed to req.ip
    }
})

app.use(limiter);

// replace the swagger null url
swaggerDocument.servers.forEach(server => {
    if (server.url === null) {
        server.url = process.env.BASE_URL;
    }
});
app.use('/api-docs',swaggerUi.serve,swaggerUi.setup(swaggerDocument));

app.use('/cups', require('./routes/cups'));
app.use('/communities', require('./routes/communities'));

app.use('/tokens', require('./routes/tokens'));

app.use('/is-alive', async (req, res) => { res.send(true) })
app.use('/version', async (req, res) => { res.json({ version: 1.0 }) })

//listen port
app.listen(process.env.PORT || 3000, () => {
    console.log('listening port ' + (process.env.PORT || 3000))
})
