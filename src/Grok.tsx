import { useState } from "react";
import { invoke } from "@tauri-apps/api";
import Result from "./Result";
import type { FormProps } from "antd";
import { Button, Form, Input } from "antd";

export default function Grok() {
    const [grokResult, setGrokResult] = useState("");
    type FieldType = {
        grok?: string;
        text?: string;
    }
    const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
        let expr = values.grok;
        let text = values.text;
        invoke("extract_fields", { expr, text }).then((result) => {
            setGrokResult(<Result result={result} />);
        }).catch((err) => setGrokResult(<p>{err}</p>));
    };

    const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
        console.log("Failed:", errorInfo);
    };

    return (
        <div>
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
                    name="grok"
                    rules={[{ required: true, message: '输入grok表达式' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item<FieldType>
                    label="Text"
                    name="text"
                    rules={[{ required: true, message: '输入待匹配到文本' }]}
                >
                    <Input />
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