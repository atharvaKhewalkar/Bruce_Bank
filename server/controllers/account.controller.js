const pool = require("../database/connect.database");
const { verifyJWT } = require("../utils/jwt.util");

const getAccountDetails = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authorization token missing or malformed" });
        }
        const token = authHeader.split(" ")[1];

        const decoded = verifyJWT(token);
        const userId = decoded.id;
        const accountId = req.params.accountId;

        const { rows } = await pool.query(`SELECT * FROM accounts WHERE id = $1 AND user_id = $2`, [accountId, userId]);

        if (rows.length === 0) {
            return res.status(403).json({ message: "No access or account not found" });
        }

        return res.status(200).json(rows[0]);
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        } else if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        } else {
            return res.status(500).json({ message: `${err}` });
        }
    }
};

const getAllUserAccounts = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authorization token missing or malformed" });
        }
        const token = authHeader.split(" ")[1];

        const decoded = verifyJWT(token);
        const userId = decoded.id;

        const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);

        const { rows } = await pool.query(`SELECT * FROM accounts WHERE user_id = $1`, [userId]);
        return res.status(200).json({ accounts: rows, user: result.rows[0] });

    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        } else if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        } else {
            return res.status(500).json({ message: `${err}` });
        }
    }
};

const createAccount = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authorization token missing or malformed" });
        }
        const token = authHeader.split(" ")[1];

        const { initial_balance } = req.body;
        const decoded = verifyJWT(token);
        const userId = decoded.id;

        const { rows } = await pool.query(
            `INSERT INTO accounts (user_id, balance) VALUES ($1, $2) RETURNING *`,
            [userId, initial_balance || 0.00]
        );

        return res.status(201).json(rows[0]);
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        } else if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        } else {
            return res.status(500).json({ message: `${err}` });
        }
    }
};
const updateAccount = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization token missing or malformed" });
      }
  
      const token = authHeader.split(" ")[1];
      const decoded = verifyJWT(token);
      const userId = decoded.id;
  
      const { fromAccountId, toAccountId, amount } = req.body;
  
      if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid transfer details" });
      }
  
      const fromAccountResult = await pool.query(
        `SELECT * FROM accounts WHERE id = $1 AND user_id = $2`,
        [fromAccountId, userId]
      );
      if (fromAccountResult.rows.length === 0) {
        return res.status(403).json({ message: "Unauthorized or source account not found" });
      }
  
      const fromAccount = fromAccountResult.rows[0];
  
      if (parseFloat(fromAccount.balance) < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
  
      const toAccountResult = await pool.query(`SELECT * FROM accounts WHERE id = $1`, [toAccountId]);
      if (toAccountResult.rows.length === 0) {
        return res.status(404).json({ message: "Destination account not found" });
      }
  
      const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
      const debitLog = `Debited ₹${amount} to ${toAccountId} on ${timestamp}`;
      const creditLog = `Credited ₹${amount} from ${fromAccountId} on ${timestamp}`;
  
      await pool.query("BEGIN");
  
      await pool.query(
        `UPDATE accounts
         SET balance = balance - $1,
             logs = array_append(logs, $2)
         WHERE id = $3`,
        [amount, debitLog, fromAccountId]
      );
  
      await pool.query(
        `UPDATE accounts
         SET balance = balance + $1,
             logs = array_append(logs, $2)
         WHERE id = $3`,
        [amount, creditLog, toAccountId]
      );
  
      await pool.query("COMMIT");
  
      const updatedAccounts = await pool.query(
        `SELECT * FROM accounts WHERE user_id = $1`,
        [userId]
      );
  
      return res.status(200).json({
        message: "Transfer successful",
        accounts: updatedAccounts.rows
      });
  
    } catch (err) {
      await pool.query("ROLLBACK");
      return res.status(500).json({ message: "Transfer failed", error: `${err}` });
    }
  };
const deleteAccount = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authorization token missing or malformed" });
        }
        const token = authHeader.split(" ")[1];

        const decoded = verifyJWT(token);
        const userId = decoded.id;
        const accountId = req.params.accountId;

        const check = await pool.query(`SELECT * FROM accounts WHERE id = $1 AND user_id = $2`, [accountId, userId]);
        if (check.rows.length === 0) {
            return res.status(403).json({ message: "Unauthorized or account not found" });
        }

        await pool.query(`DELETE FROM accounts WHERE id = $1`, [accountId]);
        return res.status(200).json({ message: "Account deleted successfully" });
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        } else if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        } else {
            return res.status(500).json({ message: `${err}` });
        }
    }
};

module.exports = {
    getAccountDetails,
    getAllUserAccounts,
    createAccount,
    deleteAccount,
    updateAccount
};
