import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const ExpenseTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Description</TableHead>
        <TableHead>Category</TableHead>
        <TableHead>Amount</TableHead>
        <TableHead>Date</TableHead>
        <TableHead className="w-[100px]">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};