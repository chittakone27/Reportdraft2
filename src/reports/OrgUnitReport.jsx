import React, { useEffect, useState } from "react";
import axios from "axios";
import OrgUnitTree from "./OrgUnitTree/OrgUnitTree";
import { API_AUTH } from "../config";
// import Fake from "./fakebutton";
import Test from "./test";
import "../App.css";
import AggregateApproval from'./aggregateApproval'
import ApprovalTable from './approvalTable'
// Ant Design
import {
  Button,
  Select,
  InputNumber,
  Tabs,
  Space,
  Spin,
  Card,
  Form,
  Row,
  Col,
  message,
} from "antd";

const { Option } = Select;
const { TabPane } = Tabs;

const OrgUnitReport = () => {
  const [rawOrgTree, setRawOrgTree] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportParams, setReportParams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [quarter, setQuarter] = useState("Q1");
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirm, setConfirm] = useState(0);
  const [report, setReport] = useState(0);


  // Convert org units to tree nodes
  const convertToTreeNodes = (units) => {
    const convert = (nodes = []) =>
      nodes.map((u) => {
        const children = u.children ? convert(u.children) : [];
        const expanded =
          selectedOrg &&
          (children.some((c) => c.expanded) || u.id === selectedOrg?.value);

        return {
          label: u.displayName,
          value: u.id,
          level: u.level,
          children,
          isSelectable: true,
          checked: selectedOrg?.value === u.id,
          expanded,
        };
      });

    return convert(units);
  };

  // Fetch org units
  const fetchOrgUnits = async () => {
    const key = "orgUnitLoading";

    // message.loading({
    //   content: "ກຳລັງໂຫຼດໂຄງຮ່າງ...",
    //   key,
    //   duration: 0,
    //   style: { fontFamily: "Noto Sans Lao, sans-serif", fontSize: "16px" },
    // });

    try {
      const meRes = await axios.get("https://hfml.gov.la/hfml/api/me.json", {
        // auth: API_AUTH,
      });

      const roots = meRes.data?.dataViewOrganisationUnits || [];

      const requests = roots.map((r) =>
        axios.get(`https://hfml.gov.la/hfml/api/organisationUnits/${r.id}.json`, {
          // auth: API_AUTH,
          params: {
            fields:
              "id,displayName,level,children[id,displayName,level,children[id,displayName,level,children[id,displayName,level,children[id,displayName,level]]]]",
          },
        })
      );

      const results = await Promise.all(requests);
      setRawOrgTree(results.map((r) => r.data));
      setLoading(false);

      message.success({
        content: "ໂຫຼດຂໍ້ມູນຫົວໜ່ວຍການຈັດຕັ້ງສຳເລັດ",
        key,
        duration: 2,
        style: { fontFamily: "Noto Sans Lao, sans-serif", fontSize: "16px" },
      });
    } catch (err) {
      console.error(err);
      setLoading(false);

      message.error({
        content: "❌ ໂຫຼດຂໍ້ມູນຫົວໜ່ວຍການຈັດຕັ້ງບໍ່ສຳເລັດ",
        key,
        duration: 2,
        style: { fontFamily: "Noto Sans Lao, sans-serif", fontSize: "16px" },
      });
    }
  };
  const handleApprovalSuccess = () => {
  setRefreshKey(prev => prev + 1);
};

  useEffect(() => {
    fetchOrgUnits();
  }, []);

  useEffect(() => {
    if (!rawOrgTree.length) return;
    setTreeData(convertToTreeNodes(rawOrgTree));
  }, [rawOrgTree, selectedOrg]);

  // Handlers
  const handleSelect = (_, selectedNodes) => {
    if (!selectedNodes?.length) return;
    const node = selectedNodes[0];

    setSelectedOrg({
      value: node.value,
      label: node.label,
      level: node.level,
    });

    setReportParams(null);
    setActiveTab("details");
  };

  const handleGenerateReport = () => {
    if (!selectedOrg) return;
    setReportParams({
      orgUnitId: selectedOrg.value,
      orgUnitLabel: selectedOrg.label,
      orgUnitLevel: selectedOrg.level,
      year,
      quarter,
    });
  };
   



  useEffect(() => {
    if (!reportParams) return;
   
    setActiveTab("details");
  }, [reportParams]);

  // Render loading state first
  if (loading) {
    return (
      <div
        style={{
          fontFamily: "'Noto Sans Lao', sans-serif",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
<Spin
  tip={
    <span style={{ fontFamily: "'Noto Sans Lao', sans-serif", fontSize: 16 }}>
      ກຳລັງໂຫຼດຂໍ້ມູນຫົວໜ່ວຍການຈັດຕັ້ງ...
    </span>
  }
  size="large"
/>      </div>
    );
  }

  // Main content
  return (
    <div
      style={{
        fontFamily: "'Noto Sans Lao', sans-serif",
        padding: "0 24px",
        maxWidth: "90%",
        margin: "0 auto",
      }}
    >
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Form layout="vertical">
            <OrgUnitTree data={treeData} onChange={handleSelect} />

            <Row gutter={16} align="bottom">
              <Col>
                <Form.Item label="ເລືອກໄຕມາດ">
                  <Select
                    style={{ width: 250 }}
                    value={quarter}
                    onChange={(val) => {
                      setQuarter(val);
                      setReportParams(null);
                    }}
                  >
                    <Option value="Q1">ໄຕມາດທີ I (ມັງກອນ ຫາ ມີນາ)</Option>
                    <Option value="Q2">ໄຕມາດທີ II (ເມສາ ຫາ ມິຖຸນາ)</Option>
                    <Option value="Q3">ໄຕມາດທີ III (ກໍລະກົດ ຫາ ກັນຍາ)</Option>
                    <Option value="Q4">ໄຕມາດທີ IV (ຕຸລາ ຫາ ທັນວາ)</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col>
                <Form.Item label="ເລືອກປີ">
                  <InputNumber
                    min={2000}
                    max={new Date().getFullYear()}
                    value={year}
                    onChange={(val) => {
                      setYear(val);
                      setReportParams(null);
                    }}
                  />
                </Form.Item>
              </Col>

              <Col>
                <Form.Item label="&nbsp;">
                  <Button type="primary" onClick={handleGenerateReport} disabled={!selectedOrg}>
                    ເອົາລາຍງານ
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Space>
      </Card>

      {reportParams && (
   <Tabs
  activeKey={activeTab}
  onChange={(key) => setActiveTab(key)}
  style={{ marginTop: 20 }}
  tabBarStyle={{ fontFamily: "'Noto Sans Lao', sans-serif", fontSize: 16 }}
>
  <TabPane
  tab="ອະນຸມັດຈໍານວນຜູ້ເສຍຊີວິດປະຈໍາໄຕມາດ"
  key="details"
>
  <h1>{reportParams.orgUnitLabel}</h1>
  
  {reportParams.orgUnitLevel !== 5 && confirm == 0 && report == 0 && (
    <AggregateApproval
      orgUnitId={reportParams.orgUnitId}
      year={reportParams.year}
      quarter={reportParams.quarter}
      Level={reportParams.orgUnitLevel}
      Label={reportParams.orgUnitLabel}
      confirm ={confirm}
      report ={report}
      onSuccess={handleApprovalSuccess}
    />
   )} 
        <ApprovalTable orgUnitId={reportParams.orgUnitId} year={reportParams.year} quarter={reportParams.quarter} Level={reportParams.orgUnitLevel}label ={reportParams.orgUnitLabel} Confirm={setConfirm} Report={setReport}/>
  <Test
    key={refreshKey}   // 👈 forces remount
    orgUnitId={reportParams.orgUnitId}
    year={reportParams.year}
    quarter={reportParams.quarter}
    level={reportParams.orgUnitLevel}
    Label={reportParams.orgUnitLabel}
  />
</TabPane>
        </Tabs>
      )}
    </div>
  );
};

export default OrgUnitReport;