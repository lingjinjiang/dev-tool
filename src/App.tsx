import Grok from "./tools/grok/Grok";
import TimeConverter from "./tools/time/TimeConverter";
import Prometheus from "./tools/metrics/Prometheus";
import LanceViewer from "./tools/lance/LanceViewer";
import JsonValidator from "./tools/json/JsonValidator";
import "./App.css";
import { Routes, Route, useNavigate } from "react-router-dom";
import { makeStyles } from "@fluentui/react-components";
import {
  NavDrawer,
  NavDrawerBody,
  NavItem as NavItemComponent,
} from "@fluentui/react-nav-preview";

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
});

type NavItemConfig = {
  path: string;
  label: string;
  key: string;
};

const navItems: NavItemConfig[] = [
  { path: "/grok", label: "Grok 解析", key: "grok" },
  { path: "/time", label: "时间转换", key: "time" },
  { path: "/metrics", label: "指标查询", key: "metrics" },
  { path: "/lance", label: "LanceDB", key: "lance" },
  { path: "/json", label: "JSON 校验", key: "json" },
];

export default function App() {
  const styles = useStyles();
  const navigate = useNavigate();

  const buildNavItems = () =>
    navItems.map((item) => (
      <NavItemComponent
        key={item.key}
        style={{ padding: "4px 8px" }}
        value={item.key}
        onClick={() => navigate(item.path, { replace: true })}
      >
        {item.label}
      </NavItemComponent>
    ));

  return (
    <div className={styles.root}>
      <NavDrawer
        defaultSelectedValue="grok"
        defaultSelectedCategoryValue="1"
        open={true}
        type="inline"
        style={{ height: "100vh", width: "auto", minWidth: 0, flexShrink: 0 }}
      >
        <NavDrawerBody style={{ padding: "8px 0" }}>
          {buildNavItems()}
        </NavDrawerBody>
      </NavDrawer>
      <div className={styles.content}>
        <Routes>
          <Route path="/" element={<Grok />} />
          <Route path="/grok" element={<Grok />} />
          <Route path="/time" element={<TimeConverter />} />
          <Route path="/metrics" element={<Prometheus />} />
          <Route path="/lance" element={<LanceViewer />} />
          <Route path="/json" element={<JsonValidator />} />
        </Routes>
      </div>
    </div>
  );
}
