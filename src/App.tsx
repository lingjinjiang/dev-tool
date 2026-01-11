import React from "react";
import Grok from './tools/grok/Grok'
import TimeConverter from './tools/time/TimeConverter'
import Prometheus from './tools/metrics/Prometheus'
import LanceViewer from './tools/lance/LanceViewer'
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
    padding: "16px",
    display: "grid",
    justifyContent: "center",
    alignItems: "flex-start",
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
  }];
  const buildNavItems = () => {
    return navItems.map(i => <NavItem value={i.key} onClick={i.navigate}>{i.label}</NavItem>)
  };
  return (
    <div className={styles.root}>
      <NavDrawer
        defaultSelectedValue='grok'
        defaultSelectedCategoryValue="1"
        open={true}
        type={"inline"}
        style={{ height: '100vh', width: "100px" }}
      >
        <NavDrawerBody>
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
        </Routes>
      </div>
    </div>
  )
}
export default App;
