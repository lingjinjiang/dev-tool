import {
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@fluentui/react-components";

const columns = [
  { columnKey: "pattern", label: "字段名" },
  { columnKey: "value", label: "值" },
];

type ResultProps = {
  result: Record<string, string>;
};

export default function Result({ result }: ResultProps) {
  const items = Object.entries(result)
    .map(([pattern, value]) => ({ pattern, value }))
    .sort((a, b) => a.pattern.localeCompare(b.pattern));

  return (
    <Table aria-label="Grok 提取结果" style={{ minWidth: "510px" }}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHeaderCell key={column.columnKey}>
              {column.label}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.pattern}>
            <TableCell>
              <TableCellLayout>{item.pattern}</TableCellLayout>
            </TableCell>
            <TableCell>
              <TableCellLayout>{item.value}</TableCellLayout>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
