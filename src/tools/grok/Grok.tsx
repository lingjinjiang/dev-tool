import { useState } from "react";
import { invoke } from "@tauri-apps/api";
import Result from "./Result";
import type { FormProps } from "antd";
import { Button, Form, Input, Drawer, Tag } from "antd";
import DefaultField from "./DefaultField";

export default function Grok() {
    const [grokResult, setGrokResult] = useState<React.ReactNode>(null);
    const [validateResult, setValidateResult] = useState<React.ReactNode>(null);
    type FieldType = {
        grok?: string;
        text?: string;
    }
    const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
        let expr = values.grok;
        let text = values.text;
        invoke("extract_fields", { expr, text }).then((result) => {
            setGrokResult(<Result result={result as Map<String, String>} />);
        }).catch((err) => setGrokResult(<p>{err}</p>));
    };

    const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
        console.log("Failed:", errorInfo);
    };
    const [open, setOpen] = useState(false);

    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    const onInputGrokChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { value: expr } = e.target
        validateGrok(expr).then((result: string[]) => {
            let tags = result.map(r => <Tag>{r}</Tag>)
            setValidateResult(<div>{tags}</div>)
        }).catch((err) => setValidateResult(<p>{err}</p>))

    }

    const validateGrok = (expr: string): Promise<string[]> => {
        return invoke("validate_grok", { expr });
    }

    return (
        <div>
            <Button type="primary" onClick={showDrawer}>内置字段</Button>
            <Drawer title='内置字段' onClose={onClose} open={open}>
                <DefaultField />
            </Drawer>
            <Form name="basic"
                labelCol={{ span: 3 }}
                wrapperCol={{ span: 16 }}
                style={{ maxWidth: 800 }}
                initialValues={{ rememmber: true }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <Form.Item<FieldType>
                    label="Grok"
                    name="grok" style={{ margin: 0 }}
                    rules={[{ required: true, message: '输入grok表达式' }]}
                >
                    <Input.TextArea onChange={onInputGrokChange} />
                </Form.Item>
                <Form.Item wrapperCol={{ offset: 3, span: 16 }}>
                    <div>{validateResult}</div>
                </Form.Item>

                <Form.Item<FieldType>
                    label="Text"
                    name="text"
                    rules={[{ required: true, message: '输入待匹配到文本' }]}
                >
                    <Input.TextArea />
                </Form.Item>
                <Form.Item wrapperCol={{ offset: 3, span: 16 }}>
                    <Button type="primary" htmlType="submit">
                        Parse
                    </Button>
                </Form.Item>
            </Form>
            <div>
                {grokResult}
            </div>
        </div >
    )
}