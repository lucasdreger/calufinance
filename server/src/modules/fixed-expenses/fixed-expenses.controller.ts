import { FastifyReply, FastifyRequest } from 'fastify';
import { getFixedExpensesRepository } from './fixed-expenses.repository';

export async function getFixedExpensesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = request.user;

  const repository = getFixedExpensesRepository();
  
  try {
    const fixedExpenses = await repository
      .createQueryBuilder('fixed_expense_plans')
      .where('fixed_expense_plans.user_id = :userId', { userId: user.id })
      .leftJoinAndSelect('fixed_expense_plans.statuses', 'status')
      .orderBy('fixed_expense_plans.created_at', 'DESC')
      .getMany();

    return reply.send({ fixedExpenses });
  } catch (error) {
    console.error('Error fetching fixed expenses:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}
