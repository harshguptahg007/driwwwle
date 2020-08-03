const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();

const auth = require("../../middleware/auth");
const upload = require("../../middleware/cloudinary");
const Post = require("../../models/Post");

// @route:    POST api/posts
// @desc:     Create a post
// @access:   Private
router.post(
  "/",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("techTags", "Atleast 1 tag is required").not().isEmpty(),
      check("websiteUrl", "Enter a valid URL").isURL(),
      check("websiteUrl", "Website URL is required").not().isEmpty(),
    ],
    upload,
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Create post object
      const { title, description, techTags, websiteUrl, repoUrl } = req.body;

      const newPost = {};
      newPost.user = req.user.id;
      if (title) newPost.title = title;
      if (description) newPost.description = description;
      if (websiteUrl) newPost.websiteUrl = websiteUrl;
      if (repoUrl) newPost.repoUrl = repoUrl;

      // Get only links from the file object
      if (req.files) {
        newPost.images = req.files.map((image) => image.path);
      }

      // Split comma seperated tags into individual tags
      if (techTags) {
        newPost.techTags = techTags.split(",").map((tag) => tag.trim());
      }

      const post = new Post(newPost);
      await post.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send("There was an issue with the server. Try again later.");
    }
  }
);

// @route:    GET api/posts
// @desc:     Get all posts
// @access:   Private
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .send("There was an issue with the server. Try again later.");
  }
});

// @route:    GET api/posts/:post_id
// @desc:     Get post by ID
// @access:   Private
router.get("/:post_id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    // If there's no such post
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res
      .status(500)
      .send("There was an issue with the server. Try again later.");
  }
});

module.exports = router;
