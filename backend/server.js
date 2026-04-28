// Listings route and database connection implemented by Susan

const session = require("express-session");
const express = require("express");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(session({
secret: "studybuddy-secret",
resave: false,
saveUninitialized: true
}));

app.use((req, res, next) => {
res.locals.loggedInUser = req.session.user;
next();
});

/* serve static files (for CSS) */
app.use(express.static("backend/public"));

/* set pug template engine */
app.set("view engine", "pug");
app.set("views", "./backend/views");

app.get("/login", (req, res) => {
res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
try {
const { email, password } = req.body;


if (!email) {
  return res.render("login", { error: "Email required" });
}

const [rows] = await db.query(
  "SELECT * FROM users WHERE email = ?",
  [email]
);

if (rows.length === 0 || password !== "1234") {
  return res.render("login", { error: "Invalid email or password" });
}

req.session.user = rows[0];
res.redirect("/listings");


} catch (error) {
console.error(error);
res.send("Login error");
}
});

app.get("/logout", (req, res) => {
req.session.destroy(() => {
res.redirect("/listings");
});
});

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
    const { search } = req.query;

    let query = `
      SELECT listings.id, listings.title, listings.description, listings.category, users.name
      FROM listings
      JOIN users ON listings.user_id = users.id
    `;

    if (search) {
      query += " WHERE listings.title LIKE ? OR listings.category LIKE ?";
    }

    const [rows] = search
      ? await db.query(query, [`%${search}%`, `%${search}%`])
      : await db.query(query);

    res.render("listings", { listings: rows, search });

  } catch (error) {
    console.error(error);
    res.send("Error loading listings");
  }
});

/* NEW LISTING PAGE */
app.get("/listings/new", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
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
  if (!req.session.user) {
    return res.redirect("/login");
  }

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

/* Delete Route */

app.post("/listings/:id/delete", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
}

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

    // CHECK LISTING EXISTS
    const [existing] = await db.query(
      "SELECT id FROM listings WHERE id = ?",
      [listingId]
    );

    if (existing.length === 0) {
      return res.status(404).send("Listing not found");
    }

    // VALIDATION
    if (!title || !description || !category) {
      return res.status(400).send("All fields are required");
    }

    if (title.trim().length < 3) {
      return res.status(400).send("Title must be at least 3 characters");
    }

    // UPDATE SAFE DATA
    await db.query(
      "UPDATE listings SET title = ?, description = ?, category = ? WHERE id = ?",
      [title.trim(), description.trim(), category, listingId]
    );

    // BETTER REDIRECT
    res.redirect(`/listings/${listingId}`);

  } catch (error) {
    console.error(error);
    res.send("Error updating listing");
  }
});

/* START SERVER */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});