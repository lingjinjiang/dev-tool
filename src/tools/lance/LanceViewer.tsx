import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";
import { open } from "@tauri-apps/api/dialog";
import {
    Button,
    Field,
    Input,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    TabList,
    Tab,
    SelectTabData,
    SelectTabEvent,
    SelectTabEventHandler,
    TabValue,
    makeStyles,
    tokens,
    Spinner,
    Text,
    Textarea,
    Tag,
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
});

type TableInfo = {
    name: string;
    schema: Array<{
        name: string;
        data_type: string;
        nullable: boolean;
    }>;
    num_rows: number;
    num_columns: number;
    indices: Array<{
        name: string;
        index_type: string;
        columns: string[];
    }>;
};

type PageData = {
    rows: Array<Record<string, any>>;
    total_rows: number;
    page: number;
    page_size: number;
    total_pages: number;
};

type SqlResult = {
    rows: Array<Record<string, any>>;
    columns: string[];
    total_rows: number;
};

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

    const handleTabSelect: SelectTabEventHandler = (_event: SelectTabEvent, data: SelectTabData) => {
        setSelectedTab(data.value);
    };

    const loadTables = async () => {
        if (!directory.trim()) return;

        setLoading(true);
        try {
            const result = await invoke<string[]>("list_lance_tables", { directory });
            setTables(result);
            if (result.length > 0 && !selectedTable) {
                setSelectedTable(result[0]);
            }
        } catch (error) {
            console.error("Failed to load tables:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadTableInfo = async (tableName: string) => {
        setLoading(true);
        try {
            const info = await invoke<TableInfo>("get_table_info", {
                directory,
                tableName,
            });
            setTableInfo(info);
        } catch (error) {
            console.error("Failed to load table info:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadTableData = async (tableName: string, page: number, size: number) => {
        setLoading(true);
        try {
            const data = await invoke<PageData>("get_table_data", {
                directory,
                tableName,
                page,
                pageSize: size,
            });
            setPageData(data);
        } catch (error) {
            console.error("Failed to load table data:", error);
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
        } catch (error: any) {
            setSqlError(String(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTable && directory) {
            loadTableInfo(selectedTable);
            loadTableData(selectedTable, currentPage, pageSize);
        }
    }, [selectedTable, directory, currentPage, pageSize]);

    const handleDirectorySubmit = () => {
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
                <Text size={500} weight="semibold">Schema Information</Text>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHeaderCell>Column Name</TableHeaderCell>
                            <TableHeaderCell>Data Type</TableHeaderCell>
                            <TableHeaderCell>Nullable</TableHeaderCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableInfo.schema.map((field, index) => (
                            <TableRow key={index}>
                                <TableCell>{field.name}</TableCell>
                                <TableCell>{field.data_type}</TableCell>
                                <TableCell>{field.nullable ? "Yes" : "No"}</TableCell>
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
                <Text size={500} weight="semibold">Index Information</Text>
                {tableInfo.indices.length === 0 ? (
                    <Text>No indices found</Text>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>Index Name</TableHeaderCell>
                                <TableHeaderCell>Type</TableHeaderCell>
                                <TableHeaderCell>Columns</TableHeaderCell>
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
                <Text size={500} weight="semibold">Table Statistics</Text>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div>
                        <Text weight="semibold">Table Name:</Text> {tableInfo.name}
                    </div>
                    <div>
                        <Text weight="semibold">Number of Rows:</Text> {tableInfo.num_rows.toLocaleString()}
                    </div>
                    <div>
                        <Text weight="semibold">Number of Columns:</Text> {tableInfo.num_columns}
                    </div>
                    <div>
                        <Text weight="semibold">Number of Indices:</Text> {tableInfo.indices.length}
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
                                    {tableInfo.schema.map((field) => {
                                        const value = row[field.name];
                                        let displayValue = "";
                                        if (value === null || value === undefined) {
                                            displayValue = "null";
                                        } else if (typeof value === "object") {
                                            displayValue = JSON.stringify(value);
                                        } else {
                                            displayValue = String(value);
                                        }
                                        return (
                                            <TableCell key={field.name}>
                                                <Text font="monospace">{displayValue}</Text>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className={styles.pagination}>
                    <Button
                        appearance="subtle"
                        onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                    >
                        Previous
                    </Button>
                    <Text>
                        Page {currentPage + 1} of {pageData.total_pages}
                    </Text>
                    <Button
                        appearance="subtle"
                        onClick={() => handlePageChange(Math.min(pageData.total_pages - 1, currentPage + 1))}
                        disabled={currentPage >= pageData.total_pages - 1}
                    >
                        Next
                    </Button>
                    <select
                        value={pageSize.toString()}
                        onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                        style={{ width: "100px", padding: "4px" }}
                    >
                        <option value="10">10 per page</option>
                        <option value="25">25 per page</option>
                        <option value="50">50 per page</option>
                        <option value="100">100 per page</option>
                    </select>
                    <Text>
                        Showing {pageData.rows.length} of {pageData.total_rows.toLocaleString()} rows
                    </Text>
                </div>
            </div>
        );
    };

    const renderSqlTab = () => {
        const paginatedRows = getPaginatedSqlRows();
        const totalPages = getSqlTotalPages();

        return (
            <div className={styles.tabContent}>
                <div className={styles.sqlInputRow}>
                    <Field label="SQL Query" className={styles.sqlInput}>
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
                    <Button appearance="primary" onClick={executeSql} disabled={loading}>
                        Execute
                    </Button>
                </div>

                {sqlError && (
                    <div style={{ padding: "12px", backgroundColor: tokens.colorPaletteRedBackground1, borderRadius: tokens.borderRadiusMedium, color: tokens.colorPaletteRedForeground1 }}>
                        <Text>{sqlError}</Text>
                    </div>
                )}

                {sqlResult && (
                    <>
                        <div className={styles.resultMeta}>
                            <Tag appearance="filled" color="brand">{sqlResult.total_rows} rows</Tag>
                            <Text size={200}>Columns: {sqlResult.columns.join(", ")}</Text>
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
                                                    {sqlResult.columns.map((col) => {
                                                        const value = row[col];
                                                        let displayValue = "";
                                                        if (value === null || value === undefined) {
                                                            displayValue = "null";
                                                        } else if (typeof value === "object") {
                                                            displayValue = JSON.stringify(value);
                                                        } else {
                                                            displayValue = String(value);
                                                        }
                                                        return (
                                                            <TableCell key={col}>
                                                                <Text font="monospace">{displayValue}</Text>
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {sqlResult.total_rows > sqlPageSize && (
                                    <div className={styles.pagination}>
                                        <Button
                                            appearance="subtle"
                                            onClick={() => setSqlPage(Math.max(0, sqlPage - 1))}
                                            disabled={sqlPage === 0}
                                        >
                                            Previous
                                        </Button>
                                        <Text>
                                            Page {sqlPage + 1} of {totalPages}
                                        </Text>
                                        <Button
                                            appearance="subtle"
                                            onClick={() => setSqlPage(Math.min(totalPages - 1, sqlPage + 1))}
                                            disabled={sqlPage >= totalPages - 1}
                                        >
                                            Next
                                        </Button>
                                        <select
                                            value={sqlPageSize.toString()}
                                            onChange={(e) => {
                                                setSqlPageSize(parseInt(e.target.value));
                                                setSqlPage(0);
                                            }}
                                            style={{ width: "100px", padding: "4px" }}
                                        >
                                            <option value="10">10 per page</option>
                                            <option value="25">25 per page</option>
                                            <option value="50">50 per page</option>
                                            <option value="100">100 per page</option>
                                        </select>
                                    </div>
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
                <Field label="LanceDB Directory" className={styles.directoryInput}>
                    <Input
                        placeholder="Enter directory path (e.g., /path/to/lance/db)"
                        value={directory}
                        onChange={(e) => setDirectory(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleDirectorySubmit()}
                    />
                </Field>
                <Button onClick={async () => {
                    const selected = await open({ directory: true, multiple: false });
                    if (selected && typeof selected === 'string') {
                        setDirectory(selected);
                    }
                }}>
                    Browse
                </Button>
                <Button appearance="primary" onClick={handleDirectorySubmit}>
                    Load Tables
                </Button>
            </div>

            {loading && (
                <div className={styles.loading}>
                    <Spinner label="Loading..." />
                </div>
            )}

            {tables.length > 0 && (
                <div className={styles.content}>
                    <div className={styles.leftPanel}>
                        <Text size={500} weight="semibold">Tables</Text>
                        <div className={styles.tableList}>
                            <Table>
                                <TableBody>
                                    {tables.map((table) => (
                                        <TableRow
                                            key={table}
                                            onClick={() => handleTableSelect(table)}
                                            style={{
                                                cursor: "pointer",
                                                backgroundColor: selectedTable === table ? tokens.colorNeutralBackground1Hover : undefined,
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
                                <TabList selectedValue={selectedTab} onTabSelect={handleTabSelect}>
                                    <Tab value="schema">Schema</Tab>
                                    <Tab value="indices">Indices</Tab>
                                    <Tab value="stats">Statistics</Tab>
                                    <Tab value="data">Data</Tab>
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
