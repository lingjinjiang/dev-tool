import { useState } from "react";
import { invoke } from "@tauri-apps/api";
import Result from "./Result";
import { Button, DrawerBody, DrawerHeader, DrawerHeaderTitle, Field, OverlayDrawer, Tag, Textarea, makeStyles } from "@fluentui/react-components";
import DefaultPattern from "./DefaultPattern";
import { Dismiss24Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
    root: {
        width: "650px",
    },
    head: {
        marginBottom: "5px",
        display: "flex",
        justifyContent: "flex-end",
    },
    input: {
        backgroundColor: "#F0F0F0",
        padding: "10px",
    },
    result: {
        display: "flex",
        marginTop: "4px",
        marginLeft: "8px",
        flexDirection: "column",
    }
})

export default function Grok() {
    const styles = useStyles();
    const [text, setText] = useState("1970-01-01 00:00:00,000Z INFO this is a example");
    const [grokResult, setGrokResult] = useState<React.ReactNode>((null));
    const [validateResult, setValidateResult] = useState<React.ReactNode>((<div><Tag>level</Tag><Tag>message</Tag><Tag>time</Tag></div>));
    const [expr, setExpr] = useState("%{TIMESTAMP_ISO8601:time}%{SPACE}%{LOGLEVEL:level}%{SPACE}%{GREEDYDATA:message}");
    const [isDictOpen, setIsDictOpen] = useState(false);

    const validateGrok = (expr: string): Promise<string[]> => {
        return invoke("validate_grok", { expr });
    }

    const onGrokExprChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { value: inputExpr } = e.target;
        setExpr(inputExpr);
        validateGrok(inputExpr)
            .then((result: string[]) => {
                let tags = result.map(r => <Tag>{r}</Tag>);
                setValidateResult(<div>{tags}</div>)
            })
            .catch((error) => setValidateResult(<p>{error}</p>))
    }

    const handleSubmit = () => {
        invoke("extract_fields", { expr, text })
            .then((result) => setGrokResult(<Result result={result as Map<String, String>} />))
            .catch((error) => setGrokResult(<p>{error}</p>))
    };

    const onTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { value: inputText } = e.target;
        setText(inputText);
    }

    return (
        <div className={styles.root}>
            <div className={styles.head}>
                <Button appearance="primary" onClick={() => setIsDictOpen(!isDictOpen)}>Default Patterns</Button>
            </div>
            <div className={styles.input}>
                <Field label="Grok" style={{ marginBottom: "15px" }}>
                    <Textarea placeholder="input grok expression" value={expr} onChange={onGrokExprChange} style={{ marginBottom: "5px" }} />
                </Field>
                {validateResult}
                <Field label="Text">
                    <Textarea placeholder="input text" value={text} onChange={onTextChange} style={{ marginBottom: "5px" }} />
                </Field>
                <Button appearance="primary" onClick={handleSubmit} style={{ marginTop: "5px" }}>
                    Submit
                </Button>
            </div>
            <div>{grokResult}</div>
            <OverlayDrawer
                size={"medium"}
                open={isDictOpen}
                position="end"
                onOpenChange={(_, state) => setIsDictOpen(state.open)}
            >
                <DrawerHeader>
                    <DrawerHeaderTitle
                        action={
                            <Button
                                appearance="subtle"
                                aria-label="Close"
                                icon={<Dismiss24Regular />}
                                onClick={() => setIsDictOpen(false)}
                            />
                        }
                    >
                        Default Grok Patterns
                    </DrawerHeaderTitle>
                </DrawerHeader>
                <DrawerBody>
                    <DefaultPattern />
                </DrawerBody>
            </OverlayDrawer>
        </div>
    )
}
