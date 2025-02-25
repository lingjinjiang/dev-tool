import { Button, Input } from "@fluentui/react-components";
import EChartsReact from "echarts-for-react";
import { useState } from "react";

const Prometheus = () => {
    const [disabled, setDisabled] = useState(false);
    const [promUrl, setPromUrl] = useState("http://127.0.0.1:8080/api/v1");
    const [promQl, setPromQl] = useState("up");
    const option = {
        title: {
            text: '月度销售额趋势',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis'
        },
        xAxis: {
            type: 'category',
            data: ['一月', '二月', '三月', '四月', '五月', '六月', '七月']
        },
        yAxis: {
            type: 'value'
        },
        series: [{
            data: [820, 932, 901, 934, 1290, 1330, 1320],
            type: 'line',
        }]
    };

    const onStartClick = () => {
        setDisabled(!disabled);
    }

    const onQueryClick = () => {
        alert(promUrl + ":" + promQl);
    }

    return (
        <div style={{ width: "650px" }}>
            <div>
                <Input type="text" placeholder="prometheus url" style={{ width: "70%" }} value={promUrl} disabled={disabled} onChange={(e) => setPromUrl(e.target.value)} />
                <Button onClick={onStartClick}>Start</Button>
                <Button onClick={onQueryClick}>Query</Button>
            </div>
            <div>
                <EChartsReact option={option} style={{ width: "100%", height: "400px" }}></EChartsReact>
            </div>
            <div>
                <Input type="text" placeholder="PromQL" style={{ width: "100%" }} value={promQl} disabled={disabled} onChange={(e) => setPromQl(e.target.value)} />
            </div>
        </div>
    )
}

export default function App() {
    return (
        <>
            <Prometheus />
        </>
    )
}