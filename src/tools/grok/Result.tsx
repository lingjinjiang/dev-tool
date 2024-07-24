import { Table } from "antd";

export default function Result({ result }: { result: Map<String, String> }) {
    const columns = [
        {
            title: '字段',
            dataIndex: 'field',
            key: 'field'
        },
        {
            title: '值',
            dataIndex: 'value',
            key: 'value'
        }
    ]
    const data =
        Object.entries(result).map(([field, value], index) => ({ key: index, field, value }))
            .sort((a, b) => a.field.localeCompare(b.field));
    return (
        <Table columns={columns} dataSource={data} />
    );
}