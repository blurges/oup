import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const response = await req.context.models.Bookmark.find();
  return res.send(response);
});

router.post('/', async (req, res) => {
  const response = await req.context.models.Bookmark.findOneAndUpdate(
    {isbn: req.body.isbn},
    {$set:{isbn:req.body.isbn}},
    {new: true,
      upsert: true},
    (err, doc) => {
      if (err) {
        console.log("Something wrong when upserting data!");
      }
    });

  return res.send(response);
});

router.delete('/', async (req, res) => {
  const response = await req.context.models.Bookmark.findOneAndDelete(
    {isbn: req.body.isbn},
    function (err,doc){
      if (err) {
        console.log("Something wrong when deleting data!");
      }
  })

  return res.send(response);
});

export default router;
