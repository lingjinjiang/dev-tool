import { Table } from "antd";

export default function Result({ result }) {
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
    const data = Object.entries(result).reduce((acc, curr, index) => {
        acc.push({ key: index + 1, field: curr[0], value: curr[1] })
        return acc;
    }, []);
    return (
        <Table columns={columns} dataSource={data} />
    );
}