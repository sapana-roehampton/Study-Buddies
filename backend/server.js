// Listings route and database connection implemented by Susan

const express = require("express");
const db = require("./db");

const app = express();
const PORT = 3000;

/* serve static files (for CSS) */
app.use(express.static("public"));

/* set pug template engine */
app.set("view engine", "pug");
app.set("views", "./views");


/* HOME PAGE */
app.get("/", (req, res) => {
  res.redirect("/listings");
});


/* USERS LIST PAGE */
app.get("/users", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users");
    res.render("users", { users: rows });
  } catch (error) {
    console.error(error);
    res.send("Database error");
  }
});


/* USER PROFILE PAGE */
app.get("/users/:id", async (req, res) => {
  try {

    const userId = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );

    res.render("profile", { user: rows[0] });

  } catch (error) {
    console.error(error);
    res.send("Error loading user");
  }
});


/* LISTINGS PAGE */
app.get("/listings", async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT listings.id, listings.title, listings.description, users.name
      FROM listings
      JOIN users ON listings.user_id = users.id
    `);

    res.render("listings", { listings: rows });

  } catch (error) {
    console.error(error);
    res.send("Error loading listings");
  }
});


/* LISTING DETAIL PAGE */
app.get("/listings/:id", async (req, res) => {
  try {

    const listingId = req.params.id;

    const [rows] = await db.query(`
      SELECT listings.id, listings.title, listings.description, users.name
      FROM listings
      JOIN users ON listings.user_id = users.id
      WHERE listings.id = ?
    `, [listingId]);

    res.render("listing", { listing: rows[0] });

  } catch (error) {
    console.error(error);
    res.send("Error loading listing");
  }
});


/* START SERVER */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});