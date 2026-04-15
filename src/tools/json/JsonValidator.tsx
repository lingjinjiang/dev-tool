import { useState, useCallback } from "react";
import {
    Button,
    Field,
    Textarea,
    makeStyles,
    tokens,
    Tag,
    Tooltip,
} from "@fluentui/react-components";
import { ClipboardRegular, DismissRegular } from "@fluentui/react-icons";

const useStyles = makeStyles({
    root: {
        width: "100%",
        maxWidth: "800px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    toolbar: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
    },
    resultBox: {
        minHeight: "120px",
        padding: "12px",
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground2,
        fontFamily: "monospace",
        fontSize: "14px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflowX: "auto",
    },
    errorBox: {
        minHeight: "120px",
        padding: "12px",
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorPaletteRedBackground1,
        color: tokens.colorPaletteRedForeground1,
        fontFamily: "monospace",
        fontSize: "14px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
    },
    infoRow: {
        display: "flex",
        gap: "12px",
        alignItems: "center",
        flexWrap: "wrap",
    },
    charPointer: {
        marginTop: "8px",
        padding: "8px",
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusSmall,
        fontFamily: "monospace",
        fontSize: "12px",
        color: tokens.colorNeutralForeground2,
        overflowX: "auto",
    },
});

type ParseResult =
    | { ok: true; value: unknown }
    | { ok: false; message: string; line: number; column: number; near: string };

function getLineColumn(text: string, position: number): { line: number; column: number } {
    let line = 1;
    let column = 1;
    for (let i = 0; i < position && i < text.length; i++) {
        if (text[i] === "\n") {
            line++;
            column = 1;
        } else {
            column++;
        }
    }
    return { line, column };
}

function getNearText(text: string, position: number, radius = 20): string {
    const start = Math.max(0, position - radius);
    const end = Math.min(text.length, position + radius);
    let snippet = text.slice(start, end);
    if (start > 0) snippet = "..." + snippet;
    if (end < text.length) snippet = snippet + "...";
    return snippet;
}

function parseJson(text: string): ParseResult {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
        return { ok: false, message: "输入为空", line: 1, column: 1, near: "" };
    }
    try {
        const value = JSON.parse(trimmed);
        return { ok: true, value };
    } catch (e) {
        const err = e as SyntaxError;
        let position = 0;
        const match = err.message.match(/position (\d+)/);
        if (match) {
            position = parseInt(match[1], 10);
        }
        const { line, column } = getLineColumn(trimmed, position);
        const near = getNearText(trimmed, position);
        return {
            ok: false,
            message: err.message,
            line,
            column,
            near,
        };
    }
}

export default function JsonValidator() {
    const styles = useStyles();
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [result, setResult] = useState<ParseResult | null>(null);
    const [copied, setCopied] = useState(false);

    const updateResult = useCallback((text: string) => {
        const res = parseJson(text);
        setResult(res);
        if (res.ok) {
            setOutput(JSON.stringify(res.value, null, 2));
        } else {
            setOutput('');
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInput(value);
        updateResult(value);
    };

    const handleFormat = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        const res = parseJson(trimmed);
        if (res.ok) {
            const formatted = JSON.stringify(res.value, null, 2);
            setOutput(formatted);
            setInput(formatted);
        } else {
            setResult(res);
            setOutput('');
        }
    };

    const handleMinify = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        const res = parseJson(trimmed);
        if (res.ok) {
            const minified = JSON.stringify(res.value);
            setOutput(minified);
            setInput(minified);
        } else {
            setResult(res);
            setOutput('');
        }
    };

    const handleClear = () => {
        setInput('');
        setOutput('');
        setResult(null);
    };

    const handleCopyOutput = async () => {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // ignore
        }
    };


    return (
        <div className={styles.root}>
            <div className={styles.toolbar}>
                <Button appearance="primary" onClick={handleFormat}>
                    格式化
                </Button>
                <Button onClick={handleMinify}>压缩</Button>
                <Button icon={<DismissRegular />} onClick={handleClear}>
                    清空
                </Button>
            </div>

            <Field label="输入 JSON">
                <Textarea
                    placeholder="在此粘贴 JSON 文本"
                    value={input}
                    onChange={handleInputChange}
                    rows={10}
                    style={{ fontFamily: "monospace", fontSize: "14px" }}
                />
            </Field>

            {result && (
                <div
                    className={result.ok ? styles.resultBox : styles.errorBox}
                    style={{ borderRadius: tokens.borderRadiusMedium }}
                >
                    {result.ok ? (
                        <>
                            <div className={styles.infoRow}>
                                <Tag appearance="filled" color="success">
                                    格式正确
                                </Tag>
                                <Tooltip content={copied ? "已复制" : "复制结果"} relationship="label">
                                    <Button
                                        icon={<ClipboardRegular />}
                                        appearance="subtle"
                                        size="small"
                                        onClick={handleCopyOutput}
                                    />
                                </Tooltip>
                            </div>
                            <pre style={{ margin: "8px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {output}
                            </pre>
                        </>
                    ) : (
                        (() => {
                            const err = result as Extract<ParseResult, { ok: false }>;
                            return (
                                <>
                                    <div className={styles.infoRow}>
                                        <Tag appearance="filled" color="danger">
                                            格式错误
                                        </Tag>
                                        <span>
                                            行 {err.line}，列 {err.column}
                                        </span>
                                    </div>
                                    <div style={{ marginTop: "8px" }}>{err.message}</div>
                                    <div className={styles.charPointer}>
                                        <div>附近文本:</div>
                                        <div style={{ color: tokens.colorPaletteRedForeground1, fontWeight: "bold" }}>
                                            {err.near.replace(/\n/g, " ")}
                                        </div>
                                        <div style={{ marginTop: "4px" }}>
                                            {" ".repeat(Math.min(err.column - 1 + (err.near.startsWith("...") ? 3 : 0), err.near.length))}^
                                        </div>
                                    </div>
                                </>
                            );
                        })()
                    )}
                </div>
            )}
        </div>
    );
}
