import React from "react";
import { Layout, Menu, theme } from "antd";
import Grok from './Grok'
import "./App.css";
import { Routes, Route, useNavigate } from "react-router-dom";

const { Content, Sider } = Layout;

const items = [
  {
    key: "/grok",
    label: `Grok`
  },
  {
    key: "/test",
    label: `Test`
  }
]

const App: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const naviagte = useNavigate();
  function onClick(e) {
    naviagte(e.key, { replace: true });
  }
  return (
    <Layout>
      <Sider style={{ height: '100vh' }}>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={["/grok"]} items={items} onClick={onClick}></Menu>
      </Sider>
      <Layout>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div style={{ padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG }}>
            <Routes>
              <Route path="/" element={<Grok />} />
              <Route path="/grok" element={<Grok />} />
              <Route path="/test" element={<div>this is test</div>} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
export default App;
