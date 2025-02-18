import { Request, Response } from 'express';
import pool from '../db';

// ...existing code...

const getFixedExpensePlans = async (req: Request, res: Response) => {
  try {
    const plans = await pool.query(`
      WITH latest_status AS (
        SELECT DISTINCT ON (fixed_expense_plan_id) 
          fixed_expense_plan_id,
          is_paid,
          completed_at
        FROM fixed_expenses_status
        ORDER BY fixed_expense_plan_id, created_at DESC
      )
      SELECT 
        fp.*,
        ec.name as category_name,
        ls.is_paid,
        ls.completed_at
      FROM fixed_expense_plans fp
      LEFT JOIN expenses_categories ec ON fp.category_id = ec.id
      LEFT JOIN latest_status ls ON fp.id = ls.fixed_expense_plan_id
      ORDER BY ec.name ASC;
    `);

    res.json(plans.rows);
  } catch (error) {
    console.error('Error getting fixed expense plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ...existing code...
