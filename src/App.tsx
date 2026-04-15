import React from "react";
import Grok from './tools/grok/Grok'
import TimeConverter from './tools/time/TimeConverter'
import Prometheus from './tools/metrics/Prometheus'
import LanceViewer from './tools/lance/LanceViewer'
import JsonValidator from './tools/json/JsonValidator'
import "./App.css";
import { Routes, Route, useNavigate } from "react-router-dom";
import { makeStyles } from "@fluentui/react-components";
import { NavDrawer, NavDrawerBody, NavItem } from "@fluentui/react-nav-preview";

const useStyles = makeStyles({
  root: {
    overflow: "hidden",
    display: "flex",
  },
  content: {
    flex: "1",
    minWidth: 0,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflow: "auto",
  },
})

type NavItem = {
  navigate: React.MouseEventHandler<HTMLButtonElement>,
  label: string,
  key: string,
}

const App: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const navItems: NavItem[] = [{
    navigate: () => { navigate("/grok", { replace: true }) },
    label: `Grok`,
    key: 'grok',
  }, {
    navigate: () => { navigate("/time", { replace: true }) },
    label: `Time`,
    key: 'time',
  }, {
    navigate: () => { navigate("/metrics", { replace: true }) },
    label: `Metrics`,
    key: 'metrics',
  }, {
    navigate: () => { navigate("/lance", { replace: true }) },
    label: `LanceDB`,
    key: 'lance',
  }, {
    navigate: () => { navigate("/json", { replace: true }) },
    label: `JSON`,
    key: 'json',
  }];
  const buildNavItems = () => {
    return navItems.map(i => <NavItem style={{ padding: '4px 8px' }} value={i.key} onClick={i.navigate}>{i.label}</NavItem>)
  };
  return (
    <div className={styles.root}>
      <NavDrawer
        defaultSelectedValue='grok'
        defaultSelectedCategoryValue="1"
        open={true}
        type={"inline"}
        style={{ height: '100vh', width: 'auto', minWidth: 0, flexShrink: 0 }}
      >
        <NavDrawerBody style={{ padding: '8px 0' }}>
          {buildNavItems()}
        </NavDrawerBody>
      </NavDrawer>
      <div className={styles.content}>
        <Routes>
          <Route path="/" element={<Grok />}></Route>
          <Route path="/grok" element={<Grok />}></Route>
          <Route path="/time" element={<TimeConverter />}></Route>
          <Route path="/metrics" element={<Prometheus />}></Route>
          <Route path="/lance" element={<LanceViewer />}></Route>
          <Route path="/json" element={<JsonValidator />}></Route>
        </Routes>
      </div>
    </div>
  )
}
export default App;
