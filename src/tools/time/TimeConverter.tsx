import { useState, useEffect } from "react";
import {
  Button,
  Dropdown,
  Input,
  Option,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import moment from "moment";

const useStyles = makeStyles({
  section: {
    margin: "16px 0",
    padding: "16px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  converter: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
    flexWrap: "wrap",
    marginTop: "12px",
  },
  result: {
    marginTop: "12px",
    padding: "12px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    wordBreak: "break-all",
  },
});

const dateFormat = "YYYY-MM-DD HH:mm:ss,SSS";

type TimeUnit = "seconds" | "milliseconds" | "microseconds" | "nanoseconds";

const UNITS: Record<TimeUnit, number> = {
  seconds: 1000,
  milliseconds: 1,
  microseconds: 0.001,
  nanoseconds: 0.000001,
};

const UNIT_OPTIONS: { value: TimeUnit; label: string }[] = [
  { value: "seconds", label: "秒" },
  { value: "milliseconds", label: "毫秒" },
  { value: "microseconds", label: "微秒" },
  { value: "nanoseconds", label: "纳秒" },
];

function formatDate(date: Date): string {
  return moment(date).format(dateFormat);
}

export default function TimeConverter() {
  const styles = useStyles();

  const now = new Date();
  const [currentTime, setCurrentTime] = useState(formatDate(now));
  const [currentTimestamp, setCurrentTimestamp] = useState(now.getTime().toString());

  const [inputTimestamp, setInputTimestamp] = useState(now.getTime().toString());
  const [convertedTime, setConvertedTime] = useState(formatDate(now));
  const [inputUnit, setInputUnit] = useState<TimeUnit>("milliseconds");

  const [selectedDateTime, setSelectedDateTime] = useState(formatDate(now));
  const [convertedTimestamp, setConvertedTimestamp] = useState(now.getTime().toString());
  const [outputUnit, setOutputUnit] = useState<TimeUnit>("milliseconds");

  useEffect(() => {
    const timer = setInterval(() => {
      const n = new Date();
      setCurrentTimestamp(n.getTime().toString());
      setCurrentTime(formatDate(n));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTimestampConvert = () => {
    const ms = parseFloat(inputTimestamp) * UNITS[inputUnit];
    const date = new Date(ms);
    setConvertedTime(formatDate(date));
  };

  const handleDateTimeConvert = () => {
    const date = moment(selectedDateTime, dateFormat).toDate();
    setConvertedTimestamp((date.getTime() / UNITS[outputUnit]).toString());
  };

  return (
    <div>
      <div className={styles.section}>
        <h2>当前时间</h2>
        <div>{currentTime} / {currentTimestamp} 毫秒</div>
      </div>

      <div className={styles.section}>
        <h2>时间戳 → 日期</h2>
        <div className={styles.converter}>
          <Input
            type="text"
            placeholder="输入时间戳"
            value={inputTimestamp}
            onChange={(e) => setInputTimestamp(e.target.value)}
          />
          <Dropdown
            value={UNIT_OPTIONS.find((u) => u.value === inputUnit)?.label}
            selectedOptions={[inputUnit]}
            onOptionSelect={(_, data) => {
              const value = data.optionValue as TimeUnit | undefined;
              if (value) setInputUnit(value);
            }}
          >
            {UNIT_OPTIONS.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Dropdown>
          <Button onClick={handleTimestampConvert}>转换</Button>
        </div>
        <div className={styles.result}>{convertedTime}</div>
      </div>

      <div className={styles.section}>
        <h2>日期 → 时间戳</h2>
        <div className={styles.converter}>
          <Input
            type="text"
            placeholder="输入日期"
            value={selectedDateTime}
            onChange={(e) => setSelectedDateTime(e.target.value)}
          />
          <Dropdown
            value={UNIT_OPTIONS.find((u) => u.value === outputUnit)?.label}
            selectedOptions={[outputUnit]}
            onOptionSelect={(_, data) => {
              const value = data.optionValue as TimeUnit | undefined;
              if (value) setOutputUnit(value);
            }}
          >
            {UNIT_OPTIONS.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Dropdown>
          <Button onClick={handleDateTimeConvert}>转换</Button>
        </div>
        <div className={styles.result}>{convertedTimestamp}</div>
      </div>
    </div>
  );
}
