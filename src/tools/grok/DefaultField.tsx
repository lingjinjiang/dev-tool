import { Table } from "antd";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
const columes = [{
    title: '特征',
    dataIndex: 'pattern',
    key: 'pattern',
},
{
    title: '表达式',
    dataIndex: 'expression',
    key: 'expression',
}]
export default function DefaultField() {
    const [patterns, setPatterns] = useState({})
    useEffect(() => {
        let result: Promise<Map<String, String>> = invoke("default_patterns");
        result.then((r) => setPatterns(r));
    }, [])
    const data =
        Object.entries(patterns).map(([pattern, expression], index) => ({ key: index, pattern, expression }))
            .sort((a, b) => a.pattern.localeCompare(b.pattern));
    return (<Table columns={columes} dataSource={data}></Table>)
}