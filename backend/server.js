// Listings route and database connection implemented by Susan

const express = require("express");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));

/* serve static files (for CSS) */
app.use(express.static("backend/public"));

/* set pug template engine */
app.set("view engine", "pug");
app.set("views", "./backend/views");


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

    if (rows.length === 0) {
  return res.status(404).send("User not found");
}

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
      SELECT listings.id, listings.title, listings.description, listings.category, users.name
      FROM listings
      JOIN users ON listings.user_id = users.id
    `);

    res.render("listings", { listings: rows });

  } catch (error) {
    console.error(error);
    res.send("Error loading listings");
  }
});

/* NEW LISTING PAGE */
app.get("/listings/new", (req, res) => {
  res.render("new-listing");
});


/* LISTING DETAIL PAGE */
app.get("/listings/:id", async (req, res) => {
  try {

    const listingId = req.params.id;

    const [rows] = await db.query(`
      SELECT listings.id, listings.title, listings.description, listings.category, users.name
      FROM listings
      JOIN users ON listings.user_id = users.id
      WHERE listings.id = ?
    `, [listingId]);

    if (rows.length === 0) {
  return res.status(404).send("Listing not found");
}

  res.render("listing", { listing: rows[0] });

  } catch (error) {
    console.error(error);
    res.send("Error loading listing");
  }
});

/* CREATE LISTING (FORM SUBMIT) */
app.post("/listings", async (req, res) => {
  try {
    const { title, description, category, user_id } = req.body;

    // VALIDATION
    if (!title || !description || !category || !user_id) {
      return res.status(400).send("All fields are required");
    }

    if (title.trim().length < 3) {
      return res.status(400).send("Title must be at least 3 characters");
    }

    // CHECK USER EXISTS
    const [userCheck] = await db.query(
      "SELECT id FROM users WHERE id = ?",
      [user_id]
    );

    if (userCheck.length === 0) {
      return res.status(400).send("Invalid user selected");
    }

    // INSERT SAFE DATA
    await db.query(
      "INSERT INTO listings (title, description, category, user_id) VALUES (?, ?, ?, ?)",
      [title.trim(), description.trim(), category, user_id]
    );

    res.redirect("/listings");

  } catch (error) {
    console.error(error);
    res.send("Error creating listing");
  }
});

app.post("/listings/:id/delete", async (req, res) => {
  try {
    const listingId = req.params.id;

    await db.query("DELETE FROM listings WHERE id = ?", [listingId]);

    res.redirect("/listings");

  } catch (error) {
    console.error(error);
    res.send("Error deleting listing");
  }
});

/* SHOW EDIT PAGE */
app.get("/listings/:id/edit", async (req, res) => {
  try {
    const listingId = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM listings WHERE id = ?",
      [listingId]
    );
    if (rows.length === 0) {
  return res.status(404).send("Listing not found");
  }  

    res.render("edit-listing", { listing: rows[0] });

  } catch (error) {
    console.error(error);
    res.send("Error loading edit page");
  }
});

/* UPDATE LISTING */
app.post("/listings/:id/edit", async (req, res) => {
  try {
    const listingId = req.params.id;
    const { title, description, category } = req.body;

    await db.query(
      "UPDATE listings SET title = ?, description = ?, category = ? WHERE id = ?",
      [title, description, category, listingId]
    );

    res.redirect("/listings");

  } catch (error) {
    console.error(error);
    res.send("Error updating listing");
  }
});

/* START SERVER */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});