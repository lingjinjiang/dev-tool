import { useState, useEffect } from 'react';
import { makeStyles, useId, Input, Label, Button, Dropdown, Option } from "@fluentui/react-components";

const TimeConverter = () => {
    // 状态管理
    const [currentTime, setCurrentTime] = useState('');
    const [currentTimestamp, setCurrentTimestamp] = useState(0);
    const [inputTimestamp, setInputTimestamp] = useState('');
    const [convertedTime, setConvertedTime] = useState('');
    const [selectedDateTime, setSelectedDateTime] = useState('');
    const [convertedTimestamp, setConvertedTimestamp] = useState('');
    const [inputUnit, setInputUnit] = useState('milliseconds');
    const [outputUnit, setOutputUnit] = useState('milliseconds');

    // 单位转换系数
    const UNITS = {
        seconds: 1000,
        milliseconds: 1,
        microseconds: 0.001,
        nanoseconds: 0.000001
    };

    // 实时更新时间
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTimestamp(now.getTime());
            setCurrentTime(formatDate(now, false));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // 格式化日期
    const formatDate = (date, showMilliseconds) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return [
            `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`,
            `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
            showMilliseconds ? `,${date.getMilliseconds().toString().padStart(3, '0')}` : ''
        ].join('');
    };

    // 时间戳转日期处理
    const handleTimestampConvert = () => {
        const numericValue = parseFloat(inputTimestamp);

        if (!isNaN(numericValue)) {
            const ms = numericValue * UNITS[inputUnit];
            const date = new Date(ms);
            setConvertedTime(formatDate(date, true));
        } else {
            setConvertedTime('');
        }
    };

    // 日期转时间戳处理
    const handleDateTimeConvert = (value) => {
        setSelectedDateTime(value);

        if (value) {
            const ms = new Date(value).getTime();
            const result = ms / UNITS[outputUnit];
            setConvertedTimestamp(result.toLocaleString('fullwide', { useGrouping: false }));
        }
    };

    const onInputTimestampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value: inputExpr } = e.target;
        setInputTimestamp(inputExpr);
    }

    const onSelectUnit = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value: inputExpr } = e.target;
        setInputTimestamp(inputExpr);
    }

    // 单位变化时重新计算
    useEffect(() => {
        if (inputTimestamp) handleTimestampConvert(inputTimestamp);
    }, [inputUnit]);

    useEffect(() => {
        if (selectedDateTime) handleDateTimeConvert(selectedDateTime);
    }, [outputUnit]);
    const units = [
        "秒",
        "毫秒",
        "微秒",
        "纳秒",
    ];
    return (
        <div >
            {/* 当前时间 */}
            <div className="section">
                <h2>当前时间</h2>
                <div>{currentTime} / {currentTimestamp} 毫秒</div>
            </div>

            {/* 时间戳转日期 */}
            <div className="section">
                <h2>时间戳 → 日期</h2>
                <div className="converter">
                    <Input
                        type="text"
                        placeholder="输入时间戳"
                        value={inputTimestamp}
                        onChange={onInputTimestampChange}
                    />
                    <Dropdown defaultSelectedOptions={["milliseconds"]} defaultValue="毫秒" onOptionSelect={(e, d) => { setInputUnit(d.optionValue) }} style={{ width: "10px" }}>
                        <Option value="seconds" >秒</Option>
                        <Option value="milliseconds" >毫秒</Option>
                        <Option value="microseconds">微秒</Option>
                        <Option value="nanoseconds">纳秒</Option>
                    </Dropdown>
                    <Button onClick={handleTimestampConvert} style={{ marginTop: "5px" }}>
                        转换
                    </Button>
                    <Input
                        type="text"
                        value={convertedTime}
                    />
                </div>
            </div>

            {/* 日期转时间戳 */}
            <div className="section">
                <h2>日期 → 时间戳</h2>
                <div className="converter">
                    <Input
                        type="datetime-local"
                        value={selectedDateTime}
                        step={"1"}
                        onChange={(e) => handleDateTimeConvert(e.target.value)}
                    />

                    <Dropdown defaultSelectedOptions={["milliseconds"]} defaultValue="毫秒" onOptionSelect={(e, d) => { setOutputUnit(d.optionValue) }} >
                        <Option value="seconds" >秒</Option>
                        <Option value="milliseconds" >毫秒</Option>
                        <Option value="microseconds">微秒</Option>
                        <Option value="nanoseconds">纳秒</Option>
                    </Dropdown>
                    <Input
                        type="text"
                        value={convertedTimestamp}
                    />
                </div>
            </div>
        </div>
    );
};

// 更新样式
const styles = `
.container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1.5rem;
  font-family: 'Segoe UI', sans-serif;
}

.section {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.converter {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}

input {
  flex: 1;
  padding: 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
}

select {
  padding: 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.result {
  margin-top: 1rem;
  padding: 0.8rem;
  background: #e9ecef;
  border-radius: 6px;
  word-break: break-all;
}

`;

const Style = () => <style>{styles}</style>;

export default function App() {
    return (
        <>
            <Style />
            <TimeConverter />
        </>
    );
}