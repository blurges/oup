import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  isbn: {
    type: String,
    required: true,
  }
});

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

export default Bookmark;
