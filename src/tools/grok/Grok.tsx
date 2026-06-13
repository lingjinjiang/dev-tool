import { useState } from "react";
import { invoke } from "@tauri-apps/api";
import Result from "./Result";
import {
  Button,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Field,
  OverlayDrawer,
  Spinner,
  Tag,
  Textarea,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import DefaultPattern from "./DefaultPattern";
import { Dismiss24Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  root: {
    width: "100%",
    maxWidth: "650px",
  },
  head: {
    marginBottom: "8px",
    display: "flex",
    justifyContent: "flex-end",
  },
  input: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: "12px",
    borderRadius: tokens.borderRadiusMedium,
  },
  field: {
    marginBottom: "12px",
  },
  tags: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },
  resultBox: {
    marginTop: "12px",
  },
  errorBox: {
    marginTop: "12px",
    padding: "12px",
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
    borderRadius: tokens.borderRadiusMedium,
  },
  submitButton: {
    marginTop: "8px",
  },
});

export default function Grok() {
  const styles = useStyles();
  const [text, setText] = useState(
    "1970-01-01 00:00:00,000Z INFO this is an example"
  );
  const [expr, setExpr] = useState(
    "%{TIMESTAMP_ISO8601:time}%{SPACE}%{LOGLEVEL:level}%{SPACE}%{GREEDYDATA:message}"
  );

  const [validateFields, setValidateFields] = useState<string[]>([
    "level",
    "message",
    "time",
  ]);
  const [validateError, setValidateError] = useState<string | null>(null);

  const [grokResult, setGrokResult] = useState<Record<string, string> | null>(
    null
  );
  const [grokError, setGrokError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDictOpen, setIsDictOpen] = useState(false);

  const validateGrok = (inputExpr: string): Promise<string[]> =>
    invoke("validate_grok", { expr: inputExpr });

  const onGrokExprChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputExpr = e.target.value;
    setExpr(inputExpr);
    setGrokResult(null);
    setGrokError(null);

    validateGrok(inputExpr)
      .then((fields) => {
        setValidateFields(fields);
        setValidateError(null);
      })
      .catch((error: unknown) => {
        setValidateFields([]);
        setValidateError(error instanceof Error ? error.message : String(error));
      });
  };

  const handleSubmit = () => {
    setLoading(true);
    setGrokResult(null);
    setGrokError(null);

    invoke<Record<string, string>>("extract_fields", { expr, text })
      .then((result) => {
        setGrokResult(result);
      })
      .catch((error: unknown) => {
        setGrokError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <Button
          appearance="primary"
          onClick={() => setIsDictOpen(!isDictOpen)}
        >
          内置模式
        </Button>
      </div>
      <div className={styles.input}>
        <Field label="Grok 表达式" className={styles.field}>
          <Textarea
            placeholder="输入 Grok 表达式"
            value={expr}
            onChange={onGrokExprChange}
          />
        </Field>

        {validateError ? (
          <div className={styles.errorBox}>{validateError}</div>
        ) : (
          <div className={styles.tags}>
            {validateFields.map((field) => (
              <Tag key={field}>{field}</Tag>
            ))}
          </div>
        )}

        <Field label="待匹配文本" className={styles.field}>
          <Textarea
            placeholder="输入待匹配的文本"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </Field>

        <Button
          appearance="primary"
          onClick={handleSubmit}
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? <Spinner size="tiny" /> : "提取字段"}
        </Button>
      </div>

      {grokError && <div className={styles.errorBox}>{grokError}</div>}
      {grokResult && (
        <div className={styles.resultBox}>
          <Result result={grokResult} />
        </div>
      )}

      <OverlayDrawer
        size="medium"
        open={isDictOpen}
        position="end"
        onOpenChange={(_, state) => setIsDictOpen(state.open)}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="关闭"
                icon={<Dismiss24Regular />}
                onClick={() => setIsDictOpen(false)}
              />
            }
          >
            内置 Grok 模式
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <DefaultPattern />
        </DrawerBody>
      </OverlayDrawer>
    </div>
  );
}
