import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";

interface ExpensesTableProps {
  expenses: any[];
}

export const ExpensesTable = ({ expenses }: ExpensesTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense, index) => (
          <TableRow key={index}>
            <TableCell>{expense.description}</TableCell>
            <TableCell>{expense.category}</TableCell>
            <TableCell>{formatCurrency(expense.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};