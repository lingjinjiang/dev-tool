import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import {
  Input,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@fluentui/react-components";

const columns = [
  { columnKey: "pattern", label: "模式名" },
  { columnKey: "expression", label: "表达式" },
];

type DefaultPatternItem = {
  pattern: string;
  expression: string;
};

export default function DefaultPattern() {
  const [items, setItems] = useState<DefaultPatternItem[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    invoke<Record<string, string>>("default_patterns")
      .then((patterns) => {
        const converted = Object.entries(patterns)
          .map(([pattern, expression]) => ({ pattern, expression }))
          .sort((a, b) => a.pattern.localeCompare(b.pattern));
        setItems(converted);
      })
      .catch((error: unknown) => {
        console.error("Failed to load default patterns:", error);
      });
  }, []);

  const filteredItems = filter.trim()
    ? items.filter((item) => item.pattern.includes(filter.trim()))
    : items;

  return (
    <div>
      <Input
        placeholder="筛选模式名"
        value={filter}
        onChange={(_, data) => setFilter(data.value)}
        style={{ marginBottom: "12px" }}
      />
      <Table aria-label="内置 Grok 模式">
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
          {filteredItems.map((item) => (
            <TableRow key={item.pattern}>
              <TableCell>
                <TableCellLayout>{item.pattern}</TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>{item.expression}</TableCellLayout>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
