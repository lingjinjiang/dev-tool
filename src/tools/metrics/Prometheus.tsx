import { Button, Input, Tooltip } from "@fluentui/react-components";
import EChartsReact from "echarts-for-react";
import { useState } from "react";
import { invoke } from "@tauri-apps/api";
import moment from "moment";
import Grid from "echarts/types/src/coord/cartesian/Grid.js";

const Prometheus = () => {
    const [disabled, setDisabled] = useState(false);
    const [promUrl, setPromUrl] = useState("http://127.0.0.1:8080/api/v1");
    const [promQl, setPromQl] = useState("up");
    const [chart, setChart] = useState(<EChartsReact option={{ notMerge: true }} />);

    const onStartClick = () => {
        setDisabled(!disabled);
    }

    const onQueryClick = () => {
        let currentTime: Date = new Date();
        let endTime = currentTime.getTime();
        let startTime = endTime - 30 * 60 * 1000;
        invoke("prometheus_query_range", { promUrl: promUrl, promQl: promQl, startTime: startTime, endTime: endTime, step: 15 })
            .then((response: any) => {
                let results = response["data"]["result"];
                let legends = [];
                let chartSeries = [];
                let xAxisData = [];
                for (let i = 0; i < results.length; i++) {
                    let result = results[i];
                    let legend = [];
                    for (let key in result["metric"]) {
                        legend.push(key + "=" + result["metric"][key]);
                    }
                    let name = legend.join(",");
                    legends.push(name);
                    let values = result["values"];
                    let datas = [];
                    for (let i = 0; i < values.length; i++) {
                        datas.push(values[i][1]);
                        xAxisData.push(moment(new Date(values[i][0] * 1000)).format("HH:mm:ss"));
                    }
                    chartSeries.push({ name: name, type: "line", data: datas })
                }
                setChart(
                    <EChartsReact
                        option={{
                            toolTip: { trigger: 'axis' },
                            legends: { data: legends },
                            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                            xAxis: { type: 'category', boundaryGap: false, data: [...new Set(xAxisData)] },
                            yAxis: { type: 'value' },
                            notMerge: true,
                            series: chartSeries
                        }}
                        style={{ width: '100%', height: 400 }}
                    />
                )
            })
            .catch((err) => {
                console.log(err);
            })

    }

    return (
        <div style={{ width: "650px" }}>
            <div>
                <Input type="text" placeholder="prometheus url" style={{ width: "70%" }} value={promUrl} disabled={disabled} onChange={(e) => setPromUrl(e.target.value)} />
                <Button onClick={onStartClick}>Start</Button>
                <Button onClick={onQueryClick}>Query</Button>
            </div>
            <div>
                {chart}
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