import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";
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
} from "@fluentui/react-components";

const useStyles = makeStyles({
    root: {
        width: "900px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    header: {
        display: "flex",
        gap: "16px",
        alignItems: "flex-end",
    },
    directoryInput: {
        flex: 1,
    },
    content: {
        display: "flex",
        gap: "24px",
    },
    leftPanel: {
        flex: "0 0 300px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    rightPanel: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    tableList: {
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        maxHeight: "400px",
        overflowY: "auto",
    },
    infoCard: {
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        padding: "16px",
    },
    dataTable: {
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        overflow: "hidden",
    },
    pagination: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "16px",
    },
    loading: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "200px",
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

    const handleTabSelect: SelectTabEventHandler = (event: SelectTabEvent, data: SelectTabData) => {
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
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(0);
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
            <div className={styles.dataTable}>
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
                <div className={styles.pagination} style={{ padding: "16px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                                </TabList>

                                {selectedTab === "schema" && renderSchemaTab()}
                                {selectedTab === "indices" && renderIndicesTab()}
                                {selectedTab === "stats" && renderStatsTab()}
                                {selectedTab === "data" && renderDataTab()}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
