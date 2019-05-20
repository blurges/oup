import 'dotenv/config';
import cors from 'cors';
import bodyParser from 'body-parser';
import express from 'express';
import mongoose from 'mongoose';

import Bookmark from './models';
import routes from './routes';

const app = express();

const connectDb = () => {
  return mongoose.connect(process.env.DATABASE_URL,
    {
      dbName: 'test'
    });
};

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  req.context = {
    models: { Bookmark }
  };
  next();
});

app.use('/', routes);

connectDb().then(async () => {
  app.listen(process.env.PORT || 3000, () =>
    console.log(`Example app listening on port ${process.env.PORT || 3000}!`),
  );
});
