import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/utils/formatters";

export const FixedExpensesTable = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Gym</TableCell>
          <TableCell>{formatCurrency(100)}</TableCell>
          <TableCell>
            <Checkbox />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};