require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const port = process.env.PORT || 3000;

const mongoose = require('mongoose');
const { Schema } = mongoose;
const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new Schema({
  id: { type: Number, required: true },
  url: { type: String, required: true }
});

const urls = mongoose.model('urls', urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:id?', (req, res) => {
  const id = req.params.id;
  const wrongFormat = id.match(/^[\d]+$/) === null;
  if (wrongFormat) {
    return res.json({'error': 'Wrong format'});
  }
  urls.find({id: id}, (error, urlFound) => {
    if (error) {
      return console.log(error);
    }
    if (!urlFound[0]) {
      return res.json({'error':	'No short URL found for the given input'});
    }
    const {url} = urlFound[0];
    res.redirect(url);
  });
});

app.post('/api/shorturl', (req, res) => {
  const url = req['body']['url'];
  request(url, (error, response, body) => {
    const urlExist = response && response.statusCode === 200 ? true : false;
    if (!urlExist) {
      return res.json({'error': 'Invalid URL'});
    }
    urls.count({}, (error, count) => {
      if (error) {
        return console.error(error);
      }
      const id = count + 1;
      const newUrl = new urls({id, url});
      newUrl.save((error, data) => {
        if (error) {
          return console.error(error);
        }
        res.json({
          'original_url': url,
          'short_url': id
        });
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});