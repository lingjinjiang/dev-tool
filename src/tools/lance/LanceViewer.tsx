import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";
import { open } from "@tauri-apps/api/dialog";
import {
  Button,
  Dropdown,
  Field,
  Input,
  Option,
  Spinner,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TabList,
  TabValue,
  Text,
  Textarea,
  makeStyles,
  tokens,
  SelectTabData,
  SelectTabEvent,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    height: "100%",
  },
  header: {
    display: "flex",
    gap: "16px",
    alignItems: "flex-end",
    flexShrink: 0,
  },
  directoryInput: {
    flex: 1,
  },
  content: {
    display: "flex",
    gap: "24px",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  leftPanel: {
    flex: "0 0 220px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflow: "hidden",
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    minWidth: 0,
    overflow: "hidden",
  },
  tableList: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    overflowY: "auto",
    flex: 1,
  },
  infoCard: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: "16px",
    overflow: "auto",
  },
  dataTableContainer: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: "auto",
    flex: 1,
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    padding: "12px 16px",
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    flexShrink: 0,
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "200px",
  },
  sqlInputRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
    flexShrink: 0,
  },
  sqlInput: {
    flex: 1,
    fontFamily: "monospace",
    fontSize: "14px",
  },
  resultMeta: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexShrink: 0,
  },
  tabContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
  },
  errorBox: {
    padding: "12px",
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
    borderRadius: tokens.borderRadiusMedium,
  },
});

type FieldInfo = {
  name: string;
  data_type: string;
  nullable: boolean;
};

type TableInfo = {
  name: string;
  schema: FieldInfo[];
  num_rows: number;
  num_columns: number;
  indices: Array<{
    name: string;
    index_type: string;
    columns: string[];
  }>;
};

type PageData = {
  rows: Array<Record<string, unknown>>;
  total_rows: number;
  page: number;
  page_size: number;
  total_pages: number;
};

type SqlResult = {
  rows: Array<Record<string, unknown>>;
  columns: string[];
  total_rows: number;
};

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

const PAGE_SIZE_OPTIONS = ["10", "25", "50", "100"];

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function PaginationControls({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const styles = useStyles();
  return (
    <div className={styles.pagination}>
      <Button
        appearance="subtle"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
      >
        上一页
      </Button>
      <Text>
        第 {page + 1} 页 / 共 {totalPages} 页
      </Text>
      <Button
        appearance="subtle"
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
      >
        下一页
      </Button>
      <Dropdown
        value={`${pageSize} 条/页`}
        selectedOptions={[pageSize.toString()]}
        onOptionSelect={(_, data) => {
          const value = parseInt(data.optionValue as string, 10);
          if (!isNaN(value)) onPageSizeChange(value);
        }}
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <Option key={size} value={size} text={`${size} 条/页`} />
        ))}
      </Dropdown>
    </div>
  );
}

export default function LanceViewer() {
  const styles = useStyles();
  const [directory, setDirectory] = useState("");
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabValue>("schema");
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM ");
  const [sqlResult, setSqlResult] = useState<SqlResult | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [sqlPage, setSqlPage] = useState(0);
  const [sqlPageSize, setSqlPageSize] = useState(10);

  const handleTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value);
  };

  const loadTables = async () => {
    if (!directory.trim()) return;

    setLoading(true);
    try {
      const result = await invoke<string[]>("list_lance_tables", { directory });
      setTables(result);
      setSelectedTable(result.length > 0 ? result[0] : null);
      setCurrentPage(0);
    } catch (error) {
      console.error("Failed to load tables:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSelectedTable = async (tableName: string) => {
    if (!directory.trim() || !tableName) return;

    setLoading(true);
    try {
      const [info, data] = await Promise.all([
        invoke<TableInfo>("get_table_info", {
          directory,
          tableName,
        }),
        invoke<PageData>("get_table_data", {
          directory,
          tableName,
          page: currentPage,
          pageSize,
        }),
      ]);
      setTableInfo(info);
      setPageData(data);
    } catch (error) {
      console.error("Failed to load table:", error);
    } finally {
      setLoading(false);
    }
  };

  const executeSql = async () => {
    if (!directory.trim() || !sqlQuery.trim()) return;

    setLoading(true);
    setSqlError(null);
    setSqlResult(null);
    setSqlPage(0);

    try {
      const result = await invoke<SqlResult>("execute_lance_sql", {
        directory,
        sql: sqlQuery.trim(),
      });
      setSqlResult(result);
    } catch (error: unknown) {
      setSqlError(String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTable) {
      refreshSelectedTable(selectedTable);
    }
  }, [selectedTable, currentPage, pageSize]);

  const handleDirectorySubmit = () => {
    setSqlResult(null);
    setSqlError(null);
    loadTables();
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setCurrentPage(0);
    setSqlQuery(`SELECT * FROM ${tableName}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  };

  const getPaginatedSqlRows = () => {
    if (!sqlResult) return [];
    const start = sqlPage * sqlPageSize;
    return sqlResult.rows.slice(start, start + sqlPageSize);
  };

  const getSqlTotalPages = () => {
    if (!sqlResult) return 0;
    return Math.ceil(sqlResult.total_rows / sqlPageSize);
  };

  const renderSchemaTab = () => {
    if (!tableInfo) return null;

    return (
      <div className={styles.infoCard}>
        <Text size={500} weight="semibold">
          表结构
        </Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>列名</TableHeaderCell>
              <TableHeaderCell>数据类型</TableHeaderCell>
              <TableHeaderCell>可空</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableInfo.schema.map((field, index) => (
              <TableRow key={index}>
                <TableCell>{field.name}</TableCell>
                <TableCell>{field.data_type}</TableCell>
                <TableCell>{field.nullable ? "是" : "否"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderIndicesTab = () => {
    if (!tableInfo) return null;

    return (
      <div className={styles.infoCard}>
        <Text size={500} weight="semibold">
          索引信息
        </Text>
        {tableInfo.indices.length === 0 ? (
          <Text>无索引</Text>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>索引名</TableHeaderCell>
                <TableHeaderCell>类型</TableHeaderCell>
                <TableHeaderCell>列</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableInfo.indices.map((index, idx) => (
                <TableRow key={idx}>
                  <TableCell>{index.name}</TableCell>
                  <TableCell>{index.index_type}</TableCell>
                  <TableCell>{index.columns.join(", ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };

  const renderStatsTab = () => {
    if (!tableInfo) return null;

    return (
      <div className={styles.infoCard}>
        <Text size={500} weight="semibold">
          表统计
        </Text>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div>
            <Text weight="semibold">表名：</Text> {tableInfo.name}
          </div>
          <div>
            <Text weight="semibold">行数：</Text> {tableInfo.num_rows.toLocaleString()}
          </div>
          <div>
            <Text weight="semibold">列数：</Text> {tableInfo.num_columns}
          </div>
          <div>
            <Text weight="semibold">索引数：</Text> {tableInfo.indices.length}
          </div>
        </div>
      </div>
    );
  };

  const renderDataTab = () => {
    if (!pageData || !tableInfo) return null;

    return (
      <div className={styles.tabContent}>
        <div className={styles.dataTableContainer}>
          <Table>
            <TableHeader>
              <TableRow>
                {tableInfo.schema.map((field) => (
                  <TableHeaderCell key={field.name}>{field.name}</TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {tableInfo.schema.map((field) => (
                    <TableCell key={field.name}>
                      <Text font="monospace">
                        {formatCellValue(row[field.name])}
                      </Text>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <PaginationControls
          page={currentPage}
          totalPages={pageData.total_pages}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
        <Text>
          共 {pageData.total_rows.toLocaleString()} 行，当前展示 {pageData.rows.length} 行
        </Text>
      </div>
    );
  };

  const renderSqlTab = () => {
    const paginatedRows = getPaginatedSqlRows();
    const totalPages = getSqlTotalPages();

    return (
      <div className={styles.tabContent}>
        <div className={styles.sqlInputRow}>
          <Field label="SQL 查询" className={styles.sqlInput}>
            <Textarea
              placeholder="SELECT * FROM table_name ..."
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              rows={3}
              style={{ fontFamily: "monospace", fontSize: "14px" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) {
                  executeSql();
                }
              }}
            />
          </Field>
          <Button
            appearance="primary"
            onClick={executeSql}
            disabled={loading}
          >
            {loading ? <Spinner size="tiny" /> : "执行"}
          </Button>
        </div>

        {sqlError && <div className={styles.errorBox}>{sqlError}</div>}

        {sqlResult && (
          <>
            <div className={styles.resultMeta}>
              <Text>共 {sqlResult.total_rows} 行</Text>
              <Text size={200}>列：{sqlResult.columns.join(", ")}</Text>
            </div>
            {sqlResult.total_rows > 0 && (
              <>
                <div className={styles.dataTableContainer}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {sqlResult.columns.map((col) => (
                          <TableHeaderCell key={col}>{col}</TableHeaderCell>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {sqlResult.columns.map((col) => (
                            <TableCell key={col}>
                              <Text font="monospace">
                                {formatCellValue(row[col])}
                              </Text>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {sqlResult.total_rows > sqlPageSize && (
                  <PaginationControls
                    page={sqlPage}
                    totalPages={totalPages}
                    pageSize={sqlPageSize}
                    onPageChange={setSqlPage}
                    onPageSizeChange={(size) => {
                      setSqlPageSize(size);
                      setSqlPage(0);
                    }}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Field label="LanceDB 目录" className={styles.directoryInput}>
          <Input
            placeholder="输入 LanceDB 目录路径"
            value={directory}
            onChange={(e) => setDirectory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDirectorySubmit()}
          />
        </Field>
        <Button
          onClick={async () => {
            const selected = await open({ directory: true, multiple: false });
            if (selected && typeof selected === "string") {
              setDirectory(selected);
            }
          }}
        >
          浏览
        </Button>
        <Button appearance="primary" onClick={handleDirectorySubmit}>
          加载表
        </Button>
      </div>

      {loading && (
        <div className={styles.loading}>
          <Spinner label="加载中..." />
        </div>
      )}

      {tables.length > 0 && (
        <div className={styles.content}>
          <div className={styles.leftPanel}>
            <Text size={500} weight="semibold">
              表列表
            </Text>
            <div className={styles.tableList}>
              <Table>
                <TableBody>
                  {tables.map((table) => (
                    <TableRow
                      key={table}
                      tabIndex={0}
                      role="button"
                      onClick={() => handleTableSelect(table)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleTableSelect(table);
                        }
                      }}
                      style={{
                        cursor: "pointer",
                        backgroundColor:
                          selectedTable === table
                            ? tokens.colorNeutralBackground1Hover
                            : undefined,
                      }}
                    >
                      <TableCell>{table}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className={styles.rightPanel}>
            {selectedTable && (
              <>
                <TabList
                  selectedValue={selectedTab}
                  onTabSelect={handleTabSelect}
                >
                  <Tab value="schema">结构</Tab>
                  <Tab value="indices">索引</Tab>
                  <Tab value="stats">统计</Tab>
                  <Tab value="data">数据</Tab>
                  <Tab value="sql">SQL</Tab>
                </TabList>

                <div className={styles.tabContent}>
                  {selectedTab === "schema" && renderSchemaTab()}
                  {selectedTab === "indices" && renderIndicesTab()}
                  {selectedTab === "stats" && renderStatsTab()}
                  {selectedTab === "data" && renderDataTab()}
                  {selectedTab === "sql" && renderSqlTab()}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
