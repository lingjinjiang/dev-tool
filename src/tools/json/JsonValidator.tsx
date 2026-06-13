import { useCallback, useRef, useState } from "react";
import {
  Button,
  Tab,
  TabList,
  TabValue,
  Text,
  Tooltip,
  makeStyles,
  tokens,
  SelectTabData,
  SelectTabEvent,
} from "@fluentui/react-components";
import {
  ArrowDownloadRegular,
  ClipboardRegular,
  DismissRegular,
  FlashRegular,
  SquareRegular,
  TextBulletListTreeRegular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  root: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflow: "hidden",
  },
  toolbar: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    flexShrink: 0,
  },
  main: {
    display: "flex",
    gap: "16px",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  panel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: 0,
    overflow: "hidden",
  },
  panelTitle: {
    flexShrink: 0,
    fontWeight: tokens.fontWeightSemibold,
  },
  editorWrapper: {
    display: "flex",
    flex: 1,
    minHeight: 0,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  lineNumbers: {
    flexShrink: 0,
    width: "48px",
    padding: "8px 4px",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground3,
    fontFamily: "monospace",
    fontSize: "14px",
    lineHeight: "20px",
    textAlign: "right",
    userSelect: "none",
  },
  textarea: {
    flex: 1,
    resize: "none",
    border: "none",
    outline: "none",
    padding: "8px 12px",
    fontFamily: "monospace",
    fontSize: "14px",
    lineHeight: "20px",
    backgroundColor: "transparent",
    color: tokens.colorNeutralForeground1,
  },
  outputBox: {
    flex: 1,
    minHeight: 0,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: "auto",
    backgroundColor: tokens.colorNeutralBackground1,
    fontFamily: "monospace",
    fontSize: "14px",
    lineHeight: "20px",
    padding: "8px 12px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  errorBox: {
    flexShrink: 0,
    padding: "12px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
    fontFamily: "monospace",
    fontSize: "14px",
  },
  errorLine: {
    marginTop: "8px",
    padding: "8px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
    color: tokens.colorNeutralForeground2,
    overflowX: "auto",
  },
  successBox: {
    flexShrink: 0,
    padding: "12px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorPaletteGreenBackground1,
    color: tokens.colorPaletteGreenForeground1,
  },
  treeNode: {
    display: "flex",
    flexDirection: "column",
    fontFamily: "monospace",
    fontSize: "14px",
    lineHeight: "20px",
  },
  treeRow: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
    userSelect: "none",
    paddingLeft: "4px",
  },
  treeChildren: {
    paddingLeft: "20px",
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    marginLeft: "6px",
  },
  stringValue: { color: tokens.colorPaletteGreenForeground1 },
  numberValue: { color: tokens.colorPaletteBlueForeground2 },
  booleanValue: { color: tokens.colorPalettePurpleForeground2 },
  nullValue: { color: tokens.colorNeutralForeground3 },
  keyName: { color: tokens.colorPaletteDarkOrangeForeground1 },
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

function escapeJson(text: string): string {
  return JSON.stringify(text).slice(1, -1);
}

function unescapeJson(text: string): string {
  try {
    return JSON.parse(`"${text}"`);
  } catch {
    return text;
  }
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type JsonNodeProps = {
  name?: string;
  value: unknown;
  defaultExpanded?: boolean;
};

function JsonNode({ name, value, defaultExpanded = true }: JsonNodeProps) {
  const styles = useStyles();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const renderPrimitive = (v: unknown) => {
    if (v === null) return <span className={styles.nullValue}>null</span>;
    if (typeof v === "string")
      return <span className={styles.stringValue}>"{v}"</span>;
    if (typeof v === "number")
      return <span className={styles.numberValue}>{v}</span>;
    if (typeof v === "boolean")
      return <span className={styles.booleanValue}>{v.toString()}</span>;
    return <span>{String(v)}</span>;
  };

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div className={styles.treeNode}>
          {name !== undefined && (
            <span>
              <span className={styles.keyName}>"{name}"</span>: []
            </span>
          )}
          {name === undefined && "[]"}
        </div>
      );
    }

    return (
      <div className={styles.treeNode}>
        <div
          className={styles.treeRow}
          onClick={() => setExpanded(!expanded)}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setExpanded(!expanded);
            }
          }}
        >
          <span>{expanded ? "▼" : "▶"}</span>
          <span>
            {name !== undefined && (
              <span className={styles.keyName}>"{name}"</span>
            )}
            {name !== undefined && ": "}
            [{value.length} 项]
          </span>
        </div>
        {expanded && (
          <div className={styles.treeChildren}>
            {value.map((item, index) => (
              <JsonNode key={index} value={item} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return (
        <div className={styles.treeNode}>
          {name !== undefined && (
            <span>
              <span className={styles.keyName}>"{name}"</span>: {"{ }"}
            </span>
          )}
          {name === undefined && "{ }"}
        </div>
      );
    }

    return (
      <div className={styles.treeNode}>
        <div
          className={styles.treeRow}
          onClick={() => setExpanded(!expanded)}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setExpanded(!expanded);
            }
          }}
        >
          <span>{expanded ? "▼" : "▶"}</span>
          <span>
            {name !== undefined && (
              <span className={styles.keyName}>"{name}"</span>
            )}
            {name !== undefined && ": "}
            {"{"}{entries.length} 项{"}"}
          </span>
        </div>
        {expanded && (
          <div className={styles.treeChildren}>
            {entries.map(([key, val]) => (
              <JsonNode key={key} name={key} value={val} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.treeNode}>
      {name !== undefined ? (
        <span>
          <span className={styles.keyName}>"{name}"</span>: {renderPrimitive(value)}
        </span>
      ) : (
        renderPrimitive(value)
      )}
    </div>
  );
}

function LineNumberEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const styles = useStyles();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const lineCount = value.split("\n").length;

  const handleScroll = () => {
    if (textareaRef.current && linesRef.current) {
      linesRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div className={styles.editorWrapper}>
      <div ref={linesRef} className={styles.lineNumbers}>
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder="在此粘贴 JSON 文本"
        spellCheck={false}
      />
    </div>
  );
}

export default function JsonValidator() {
  const styles = useStyles();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [outputTab, setOutputTab] = useState<TabValue>("text");

  const updateResult = useCallback((text: string) => {
    const res = parseJson(text);
    setResult(res);
    if (res.ok) {
      setOutput(JSON.stringify(res.value, null, 2));
      setOutputTab("text");
    } else {
      setOutput("");
    }
  }, []);

  const handleInputChange = (value: string) => {
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
      setOutputTab("text");
      setResult(res);
    } else {
      setResult(res);
      setOutput("");
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
      setOutputTab("text");
      setResult(res);
    } else {
      setResult(res);
      setOutput("");
    }
  };

  const handleEscape = () => {
    if (!input.trim()) return;
    const escaped = escapeJson(input);
    setOutput(escaped);
    setOutputTab("text");
  };

  const handleUnescape = () => {
    if (!input.trim()) return;
    const unescaped = unescapeJson(input);
    setOutput(unescaped);
    setOutputTab("text");
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
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

  const handleDownload = () => {
    const content = output || input;
    if (!content.trim()) return;
    downloadText("output.json", content);
  };

  const handleTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setOutputTab(data.value);
  };

  const renderOutput = () => {
    if (!result || !result.ok) return null;

    if (outputTab === "tree") {
      return (
        <div className={styles.outputBox}>
          <JsonNode value={result.value} />
        </div>
      );
    }

    return (
      <pre className={styles.outputBox}>{output}</pre>
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <Tooltip content="格式化" relationship="label">
          <Button
            appearance="primary"
            icon={<TextBulletListTreeRegular />}
            onClick={handleFormat}
          >
            格式化
          </Button>
        </Tooltip>

        <Tooltip content="压缩" relationship="label">
          <Button icon={<SquareRegular />} onClick={handleMinify}>
            压缩
          </Button>
        </Tooltip>

        <Tooltip content="转义为字符串" relationship="label">
          <Button icon={<FlashRegular />} onClick={handleEscape}>
            转义
          </Button>
        </Tooltip>

        <Tooltip content="反转义" relationship="label">
          <Button icon={<FlashRegular />} onClick={handleUnescape}>
            反转义
          </Button>
        </Tooltip>

        <Tooltip content="清空" relationship="label">
          <Button icon={<DismissRegular />} onClick={handleClear}>
            清空
          </Button>
        </Tooltip>

        <Tooltip content={copied ? "已复制" : "复制结果"} relationship="label">
          <Button
            icon={<ClipboardRegular />}
            onClick={handleCopyOutput}
            disabled={!output}
          >
            复制
          </Button>
        </Tooltip>

        <Tooltip content="下载 JSON" relationship="label">
          <Button
            icon={<ArrowDownloadRegular />}
            onClick={handleDownload}
            disabled={!input.trim()}
          >
            下载
          </Button>
        </Tooltip>
      </div>

      {result && (
        <>
          {result.ok ? (
            <div className={styles.successBox}>
              格式正确
            </div>
          ) : (
            <div className={styles.errorBox}>
              <div>
                <strong>格式错误</strong> — 行 {result.line}，列 {result.column}
              </div>
              <div>{result.message}</div>
              {result.near && (
                <div className={styles.errorLine}>
                  <div>附近文本：</div>
                  <div style={{ fontWeight: "bold" }}>
                    {result.near.replace(/\n/g, " ")}
                  </div>
                  <div>
                    {" ".repeat(
                      Math.min(
                        result.column -
                          1 +
                          (result.near.startsWith("...") ? 3 : 0),
                        result.near.length
                      )
                    )}
                    ^
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className={styles.main}>
        <div className={styles.panel}>
          <Text className={styles.panelTitle}>输入</Text>
          <LineNumberEditor value={input} onChange={handleInputChange} />
        </div>

        <div className={styles.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text className={styles.panelTitle}>输出</Text>
            {result?.ok && (
              <TabList
                selectedValue={outputTab}
                onTabSelect={handleTabSelect}
                size="small"
              >
                <Tab value="text">文本</Tab>
                <Tab value="tree">树形</Tab>
              </TabList>
            )}
          </div>
          {renderOutput() || (
            <div className={styles.outputBox}>
              输入合法的 JSON 后将在此显示输出
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
