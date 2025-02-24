import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import { Input, Table, TableBody, TableCell, TableCellLayout, TableHeader, TableHeaderCell, TableRow } from "@fluentui/react-components";

const columes = [
    { columnKey: "pattern", label: "pattern" },
    { columnKey: "expression", label: "expression" }
]

type DefaultPatternItem = {
    pattern: string,
    expression: string
}
export default function DefaultPattern() {
    const [items, setItems] = useState<DefaultPatternItem[]>([])
    const [tableContent, setTableContent] = useState<React.ReactNode>(null);
    const convertItems = (inputPatterns: Map<String, String>) => {
        return Object.entries(inputPatterns).map(([pattern, expression]) => ({ pattern: pattern, expression: expression }))
            .sort((a, b) => a.pattern.localeCompare(b.pattern));
    }
    const buildTableContent = (items: DefaultPatternItem[]) => {
        return (
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
                                {item.expression}
                            </TableCellLayout>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>)
    }
    const onFilterChange = (_: React.ChangeEvent<HTMLInputElement>, data: any) => {
        let filterCondition = data.value;
        let filteredItems;
        if (filterCondition != null && filterCondition.trim().length != 0) {
            filteredItems = items.filter(i => i.pattern.includes(filterCondition.trim()))
        } else {
            filteredItems = items
        }
        setTableContent(buildTableContent(filteredItems));
    }
    useEffect(() => {
        let result: Promise<Map<String, String>> = invoke("default_patterns");
        result.then((r) => { let items = convertItems(r); setTableContent(buildTableContent(items)); setItems(items) });
    }, [])
    return (
        <div>
            <Input onChange={onFilterChange} />
            <Table aria-label="Default Patterns">
                <TableHeader>
                    <TableRow>
                        {columes.map((colume) => (
                            <TableHeaderCell key={colume.columnKey}>
                                {colume.label}
                            </TableHeaderCell>
                        ))}
                    </TableRow>
                </TableHeader>
                {tableContent}
            </Table>
        </div>)
}