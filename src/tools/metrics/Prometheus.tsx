import { useState } from "react";
import { invoke } from "@tauri-apps/api";
import EChartsReact from "echarts-for-react";
import moment from "moment";
import {
  Button,
  Field,
  Input,
  Spinner,
  makeStyles,
  tokens,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    width: "100%",
    maxWidth: "800px",
  },
  row: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
    marginBottom: "12px",
  },
  urlInput: {
    flex: 1,
  },
  chart: {
    width: "100%",
    height: "400px",
    marginTop: "12px",
  },
  errorBox: {
    marginTop: "12px",
    padding: "12px",
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
    borderRadius: tokens.borderRadiusMedium,
  },
});

type PrometheusMetric = Record<string, string>;

type PrometheusResult = {
  metric: PrometheusMetric;
  values: Array<[number, string]>;
};

type PrometheusResponse = {
  data: {
    result: PrometheusResult[];
  };
};

function buildLegend(metric: PrometheusMetric): string {
  return Object.entries(metric)
    .map(([key, value]) => `${key}=${value}`)
    .join(",");
}

export default function Prometheus() {
  const styles = useStyles();
  const [promUrl, setPromUrl] = useState("http://127.0.0.1:8080/api/v1");
  const [promQl, setPromQl] = useState("up");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [option, setOption] = useState<Record<string, unknown> | null>(null);

  const onQueryClick = () => {
    setLoading(true);
    setError(null);
    setOption(null);

    const endTime = Date.now();
    const startTime = endTime - 30 * 60 * 1000;

    invoke<PrometheusResponse>("prometheus_query_range", {
      promUrl,
      promQl,
      startTime,
      endTime,
      step: 15,
    })
      .then((response) => {
        const results = response.data.result;
        if (results.length === 0) {
          setError("查询结果为空");
          return;
        }

        const legends: string[] = [];
        const series: Array<{
          name: string;
          type: string;
          data: string[];
        }> = [];
        const xAxisData: string[] = [];

        for (const result of results) {
          const name = buildLegend(result.metric);
          legends.push(name);

          const data = result.values.map(([timestamp, value]) => {
            xAxisData.push(moment(timestamp * 1000).format("HH:mm:ss"));
            return value;
          });

          series.push({ name, type: "line", data });
        }

        setOption({
          tooltip: { trigger: "axis" },
          legend: { data: legends },
          grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
          xAxis: {
            type: "category",
            boundaryGap: false,
            data: [...new Set(xAxisData)],
          },
          yAxis: { type: "value" },
          notMerge: true,
          series,
        });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <Field label="Prometheus 地址" className={styles.urlInput}>
          <Input
            type="text"
            placeholder="http://127.0.0.1:8080/api/v1"
            value={promUrl}
            onChange={(e) => setPromUrl(e.target.value)}
          />
        </Field>
        <Button
          appearance="primary"
          onClick={onQueryClick}
          disabled={loading}
        >
          {loading ? <Spinner size="tiny" /> : "查询"}
        </Button>
      </div>

      <Field label="PromQL">
        <Input
          type="text"
          placeholder="输入 PromQL 查询语句"
          value={promQl}
          onChange={(e) => setPromQl(e.target.value)}
        />
      </Field>

      {error && <div className={styles.errorBox}>{error}</div>}

      {option && (
        <EChartsReact
          option={option}
          style={{ width: "100%", height: "400px" }}
        />
      )}
    </div>
  );
}
