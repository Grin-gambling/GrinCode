import db from '../db/db.js';
import { createTransaction } from '../models/transactionModel.js';

async function induceTransaction(userId, wagerId, amount, type){
    const numericAmount = Number(amount);

    if (!userId) {
        throw createError('User ID required', 400);
      }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw createError('Transaction amount must be greater than 0', 400);
      }

    if (type != 'deposit' || type != 'withdrawl' || type != 'bet' || type != 'payout') {
        throw createError('Transaction not of valid type', 400);
      }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const transaction = await createTransaction(
            userId,
            numericAmount,
            type,
            wagerId,
            client
        );
    if (type == 'deposit' || type == 'payout'){
        const newAmount = await client.query(
            `
              UPDATE users
              SET balance = balance + $2
              WHERE id = $1
              RETURNING balance
            `,
            [userId, amount]
          );
          const newBalance = newAmount.rows[0];
          return newBalance;
    } else {
        const newAmount = await client.query(
            `
              UPDATE users
              SET balance = balance - $2
              WHERE id = $1
              RETURNING balance
            `,
            [userId, amount]
          );
          const newBalance = newAmount.rows[0];
          return newBalance;
    }

    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export {
    induceTransaction,
};