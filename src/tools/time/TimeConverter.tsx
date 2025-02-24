import { useState, useEffect } from 'react';
import { Input, Button } from "@fluentui/react-components";
import moment from 'moment';

const TimeConverter = () => {
    const dateFormat = 'YYYY-MM-DD HH:mm:ss,SSS';
    const initDate = new Date();
    const initDateString = moment(initDate).format(dateFormat);
    const initTimestamp = initDate.getTime().toString();
    const [currentTime, setCurrentTime] = useState(initDateString);
    const [currentTimestamp, setCurrentTimestamp] = useState(initTimestamp);
    const [inputTimestamp, setInputTimestamp] = useState(initTimestamp);
    const [convertedTime, setConvertedTime] = useState(initDateString);
    const [selectedDateTime, setSelectedDateTime] = useState(initDateString);
    const [convertedTimestamp, setConvertedTimestamp] = useState(initTimestamp);
    const [inputUnit, setInputUnit] = useState('milliseconds');
    const [outputUnit, setOutputUnit] = useState('milliseconds');

    // 单位转换系数
    const UNITS: { [key: string]: number } = {
        seconds: 1000,
        milliseconds: 1,
        microseconds: 0.001,
        nanoseconds: 0.000001
    };

    // 实时更新时间
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTimestamp(now.getTime().toString());
            setCurrentTime(formatDate(now));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // 格式化日期
    const formatDate = (date: Date) => {
        return moment(date).format(dateFormat);
    };

    // 时间戳转日期处理
    const handleTimestampConvert = () => {
        const ms = parseFloat(inputTimestamp) * UNITS[inputUnit];
        const date = new Date(ms);
        setConvertedTime(formatDate(date));
    };

    // 日期转时间戳处理
    const handleDateTimeConvert = () => {
        const date = moment(selectedDateTime, dateFormat).toDate()
        setConvertedTimestamp((date.getTime() / UNITS[outputUnit]).toString());
    };

    const onInputTimestampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value: inputExpr } = e.target;
        setInputTimestamp(inputExpr);
    }
    const onInputDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value: inputExpr } = e.target;
        setSelectedDateTime(inputExpr);
    }

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
                    <select defaultValue={"milliseconds"} onChange={(e) => { setInputUnit(e.target.value) }} >
                        <option value="seconds" >秒</option>
                        <option value="milliseconds" >毫秒</option>
                        <option value="microseconds">微秒</option>
                        <option value="nanoseconds">纳秒</option>
                    </select>
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
                        type="text"
                        value={selectedDateTime}
                        onChange={onInputDateTimeChange}
                    />
                    <select defaultValue={"milliseconds"} onChange={(e) => { setOutputUnit(e.target.value) }} >
                        <option value="seconds" >秒</option>
                        <option value="milliseconds" >毫秒</option>
                        <option value="microseconds">微秒</option>
                        <option value="nanoseconds">纳秒</option>
                    </select>
                    <Button onClick={handleDateTimeConvert} style={{ marginTop: "5px" }}>
                        转换
                    </Button>
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
  padding: 1rem;
  font-family: 'Segoe UI', sans-serif;
}

.section {
  margin: 2rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.converter {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
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