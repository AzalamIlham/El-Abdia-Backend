import express from "express";
import con from "../utils/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const checkUserSql = "SELECT * FROM admin WHERE email = ?";
  con.query(checkUserSql, [email], async (err, result) => {
    if (err) return res.json({ signupStatus: false, Error: "Query error" });
    if (result.length > 0) {
      return res.json({ signupStatus: false, Error: "Email already exists" });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const sql = "INSERT INTO admin (email, password) VALUES (?, ?)";
      con.query(sql, [email, hashedPassword], (err, result) => {
        if (err) return res.json({ signupStatus: false, Error: "Query error" });
        return res.json({ signupStatus: true });
      });
    }
  });
});

router.post("/adminlogin", (req, res) => {
  const sql = "SELECT * from admin Where email = ?";
  con.query(sql, [req.body.email], async (err, result) => {
    if (err) return res.json({ loginStatus: false, Error: "Query error" });
    if (result.length > 0) {
      const match = await bcrypt.compare(req.body.password, result[0].password);
      if (match) {
        const email = result[0].email;
        const token = jwt.sign(
          { role: "admin", email: email, id: result[0].id },
          "jwt_secret_key",
          { expiresIn: "1d" }
        );
        res.cookie("token", token);
        return res.json({ loginStatus: true });
      } else {
        return res.json({
          loginStatus: false,
          Error: "Wrong email or password",
        });
      }
    } else {
      return res.json({ loginStatus: false, Error: "Wrong email or password" });
    }
  });
});

router.get("/category", (req, res) => {
  const sql = "SELECT * FROM categorie";
  con.query(sql, (err, result) => {
    if (err) {
      console.error("Query Error:", err);
      return res.json({ Status: false, Error: "Failed to fetch categories." });
    }
    return res.json({ Status: true, Result: result });
  });
});

router.post("/add_category", (req, res) => {
  const { categorie } = req.body;

  if (!categorie) {
    return res.json({ Status: false, Error: "Category name is required." });
  }
  const sql = "INSERT INTO categorie (nom) VALUES (?)";
  con.query(sql, [categorie], (err, result) => {
    if (err) {
      console.error("Query Error:", err);
      return res.json({ Status: false, Error: "Failed to add category." });
    }
    return res.json({ Status: true });
  });
});

router.delete("/category/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM categorie WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Query Error:", err);
      return res.json({ Status: false, Error: "Failed to delete category." });
    }
    return res.json({
      Status: true,
      Message: "Category deleted successfully.",
    });
  });
});

router.put("/category/:id", (req, res) => {
  const { id } = req.params;
  const { nom } = req.body;

  if (!nom) {
    return res.json({ Status: false, Error: "Category name is required." });
  }
  const sql = "UPDATE categorie SET nom = ? WHERE id = ?";
  con.query(sql, [nom, id], (err, result) => {
    if (err) {
      console.error("Query Error:", err);
      return res.json({ Status: false, Error: "Failed to update category." });
    }
    return res.json({
      Status: true,
      Message: "Category updated successfully.",
    });
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Public/Images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({
  storage: storage,
});


router.post("/add_stock", upload.single("image"), (req, res) => {
  const sql = `INSERT INTO stock 
    (nom, numero_article, prix_unitaire, quantite, prix_totale, date, category_id, description) 
    VALUES (?)`;
  const prix_totale = req.body.prix_unitaire * req.body.quantite;
  const values = [
    req.body.nom,
    req.body.numero_article,
    req.body.prix_unitaire,
    req.body.quantite,
    prix_totale,
    req.body.date,
    req.body.category_id,
    req.body.description,
  ];
  con.query(sql, [values], (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" + err });
    return res.json({ Status: true });
  });
});

router.get("/stock", (req, res) => {
  const sql = "SELECT * FROM stock";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" });
    return res.json({ Status: true, Result: result });
  });
});

router.get("/stock/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM stock WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" });
    return res.json({ Status: true, Result: result });
  });
});

router.put("/editer_stock/:id", (req, res) => {
  const id = req.params.id;
  const sql = `UPDATE stock 
        SET nom = ?, numero_article = ?, prix_unitaire = ?, quantite = ?, prix_totale = ?, date = ?, category_id = ?, description = ? 
        WHERE id = ?`;
  const prix_totale = req.body.prix_unitaire * req.body.quantite;
  const values = [
    req.body.nom,
    req.body.numero_article,
    req.body.prix_unitaire,
    req.body.quantite,
    prix_totale,
    req.body.date,
    req.body.category_id,
    req.body.description,
  ];
  con.query(sql, [...values, id], (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" + err });
    return res.json({ Status: true, Result: result });
  });
});

router.delete("/delete_stock/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM stock WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" + err });
    return res.json({ Status: true, Result: result });
  });
});

router.get("/admin_count", (req, res) => {
  const sql = "select count(id) as admin from admin";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" + err });
    return res.json({ Status: true, Result: result });
  });
});

router.get("/stock_count", (req, res) => {
  const sql = "select count(id) as stock from stock";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" + err });
    return res.json({ Status: true, Result: result });
  });
});

router.get("/salary_count", (req, res) => {
  const sql = "select sum(prix_totale) as salaryOFSTK from stock";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" + err });
    return res.json({ Status: true, Result: result });
  });
});

router.get("/admin_records", (req, res) => {
  const sql = "select * from admin";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" + err });
    return res.json({ Status: true, Result: result });
  });
});

router.delete("/delete_admin/:id", (req, res) => {
  const adminId = req.params.id;
  const sql = "DELETE FROM admin WHERE id = ?";

  con.query(sql, [adminId], (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query Error" + err });

    if (result.affectedRows === 0) {
      return res.json({
        Status: false,
        Error: "Admin not found or already deleted",
      });
    }

    return res.json({ Status: true, Message: "Admin deleted successfully" });
  });
});



router.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: true });
});

export { router as adminRouter };
