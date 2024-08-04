import { Table, TableBody, TableCell, TableCellLayout, TableHeader, TableHeaderCell, TableRow } from "@fluentui/react-components";

const columns = [
    { columnKey: "pattern", label: "pattern" },
    { columnKey: "pattern", label: "pattern" },
];

export default function Result({ result }: { result: Map<String, String> }) {
    const items = Object.entries(result).map(([pattern, value]) => ({ pattern: pattern, value: value }))
        .sort((a, b) => a.pattern.localeCompare(b.pattern))
    return (
        <Table aria-lable="Grok Result" style={{ minWidth: "510px" }}>
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
                            <TableCellLayout>
                                {item.pattern}
                            </TableCellLayout>
                        </TableCell>
                        <TableCell>
                            <TableCellLayout>
                                {item.value}
                            </TableCellLayout>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}