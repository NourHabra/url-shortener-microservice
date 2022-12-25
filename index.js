// NEW EDITION
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
mongoose.set("strictQuery", true); //To suppress some dumbass warning
const bodyParser = require("body-parser");
var validUrl = require("valid-url");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/public", express.static(`${process.cwd()}/public`));

app.use(
	bodyParser.urlencoded({
		limit: "5000mb",
		extended: true,
		parameterLimit: 100000000000,
	})
);

const PORT = process.env.PORT || 5000;

const urlSchema = new mongoose.Schema({
	original_url: { type: String, required: true },
	short_url: { type: Number, required: true },
});

const Link = mongoose.model("Link", urlSchema, "links");

const getAllLinks = async (req, res) => {
	console.log("all links retrieved");
	const links = await Link.find({});
	res.status(200).send(links);
};

const shortenLink = async (req, res) => {
	try {
		const long_url = req.body.url;

		const format =
			/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

		if (!format.test(long_url)) {
			res.json({ error: "invalid url" });
			return;
		}
		if (!validUrl.isUri(long_url)) res.json({ error: "invalid url" });

		const links = await Link.find({}).sort({ short_url: -1 });
		lastLink = links[0].short_url;
		const link = await Link.create({
			original_url: long_url,
			short_url: ++lastLink,
		});
		console.log("new link added");
		res.status(200).send(link);
	} catch (error) {
		res.status(500).send(error);
	}
};

const redirect = async (req, res) => {
	try {
		console.log(`Redirect to ${req.params.short}`);
		const short_url = parseInt(req.params.short);

		const link = await Link.findOne({ short_url: short_url });

		if (link) res.redirect(link.original_url);
		else res.status(400).send({ msg: "Link not found." });
		return;
	} catch (err) {
		res.send(err);
	}
};

app.get("/", (req, res) => {
	res.sendFile(process.cwd() + "/views/index.html");
});

app.get("/api/shorturl/:short", redirect);
app.get("/api/shorturl", getAllLinks);
app.post("/api/shorturl", shortenLink);

const start = async () => {
	try {
		mongoose.connect(process.env.MONGO_URI);
		app.listen(PORT, () => {
			console.log(`App listening on port ${PORT}`);
		});
	} catch (error) {
		console.log(error);
	}
};

start();
