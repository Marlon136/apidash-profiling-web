// Minimal static server for the API Dash profiling site.
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  setHeaders(res) { res.setHeader('Cache-Control', 'public, max-age=300'); },
}));

app.get('/healthz', (_req, res) => res.send('ok'));

app.listen(PORT, () => {
  console.log(`API Dash profiling site running on port ${PORT}`);
});
