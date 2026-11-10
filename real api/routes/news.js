const express = require("express");
const router = express.Router();
const newscontroll = require('../controller/new');
const { adminOnly } = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');

router.get('/getannouce', newscontroll.getAllannouce);
router.post('/addanoucement', adminOnly, handleUpload('Announce_image'), newscontroll.AddAnoucement);
router.put('/editanoucement/:id', adminOnly, handleUpload('Announce_image'), newscontroll.EditNews);
router.get('/getpageannouce', adminOnly, newscontroll.getPageannouce);

module.exports = router;
