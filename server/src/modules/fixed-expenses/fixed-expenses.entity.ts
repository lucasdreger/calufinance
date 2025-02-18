import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity('fixed_expense_plans')
export class FixedExpensePlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  category_id: string;

  @Column('text')
  description: string;

  @Column('numeric')
  estimated_amount: number;

  @Column('boolean')
  is_fixed: boolean;

  @Column('boolean')
  requires_status: boolean;

  @Column('text')
  owner: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => FixedExpenseStatus, status => status.plan)
  statuses: FixedExpenseStatus[];
}

@Entity('fixed_expenses_status')
export class FixedExpenseStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  fixed_expense_plan_id: string;

  @Column('uuid')
  user_id: string;

  @Column('date')
  date: Date;

  @Column('boolean')
  is_paid: boolean;

  @CreateDateColumn()
  created_at: Date;

  @Column('timestamp with time zone', { nullable: true })
  completed_at: Date;

  @ManyToOne(() => FixedExpensePlan, plan => plan.statuses)
  @JoinColumn({ name: 'fixed_expense_plan_id' })
  plan: FixedExpensePlan;
}
