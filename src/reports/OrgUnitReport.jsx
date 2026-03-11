import React, { useEffect, useState } from "react";
import axios from "axios";
import OrgUnitTree from "./OrgUnitTree/OrgUnitTree";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Page from "./page";
import { API_AUTH } from "../config";

const OrgUnitReport = () => {
  const [rawOrgTree, setRawOrgTree] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportParams, setReportParams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  /* -----------------------------
     Convert org units to tree
  ------------------------------*/
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
          level: u.level,          // ✅ ADD THIS

          children,
          isSelectable: true, // ✅ ALL selectable
          checked: selectedOrg?.value === u.id,
          expanded,
          className: "selectable-node",
        };
      });

    return convert(units);
  };

  /* -----------------------------
     Fetch org units
  ------------------------------*/
  const fetchOrgUnits = async () => {
    const toastId = toast.loading("ກຳລັງໂຫຼດໂຄງຮ່າງການຈັດຕັ້ງ...",{style: { fontFamily: "Noto Sans Lao, sans-serif", fontSize: "16px" }});

    try {
      const meRes = await axios.get(
        "https://hfml.gov.la/hfml/api/me.json",
        { auth: API_AUTH }
      );

      const roots = meRes.data?.dataViewOrganisationUnits || [];

      const requests = roots.map((r) =>
        axios.get(
          `https://hfml.gov.la/hfml/api/organisationUnits/${r.id}.json`,
          {
            auth: API_AUTH,
            params: {
              fields:
                "id,displayName,level,children[id,displayName,level,children[id,displayName,level,children[id,displayName,level]]]",
            },
          }
        )
      );

      const results = await Promise.all(requests);
      setRawOrgTree(results.map((r) => r.data));

      toast.update(toastId, {
        render: "ໂຫຼດຂໍ້ມູນສຳເລັດ",
        type: "success",
        isLoading: false,
        autoClose: 2000,
        style: { fontFamily: "Noto Sans Lao, sans-serif", fontSize: "16px" }
      });
    } catch (err) {
      console.error(err);
      toast.update(toastId, {
        render: "❌ ໂຫຼດຂໍ້ມູນບໍ່ສຳເລັດ",
        type: "error",
        isLoading: false,
        style: { fontFamily: "Noto Sans Lao, sans-serif", fontSize: "16px" }
      });
    }
  };

  /* -----------------------------
     Effects
  ------------------------------*/
  useEffect(() => {
    fetchOrgUnits();
  }, []);

  useEffect(() => {
    if (!rawOrgTree.length) return;
    setTreeData(convertToTreeNodes(rawOrgTree));
    setLoading(false);
  }, [rawOrgTree, selectedOrg]);

  /* -----------------------------
     Handlers
  ------------------------------*/
const handleSelect = (_, selectedNodes) => {
  if (!selectedNodes?.length) return;
  setShowReport(false);

  const node = selectedNodes[0];

  setSelectedOrg({
    value: node.value,
    label: node.label,
    level: node.level, // ✅ KEEP LEVEL
  });
};

  const handleGenerateReport = () => {
    if (!selectedOrg) return;

    setReportParams({
      orgUnitId: selectedOrg.value,
      orgUnitLabel: selectedOrg.label,
      orgUnitLevel: selectedOrg.level,

      year,
    });

    setShowReport(true);
  };

  /* -----------------------------
     Render
  ------------------------------*/
  return (
    <div style={{ fontFamily: "'Noto Sans Lao', sans-serif" }}>
      <ToastContainer position="top-right" theme="colored" />

      {!loading && (
        <div className="container py-3">
          <div className="d-flex gap-3 align-items-end flex-wrap no-print">
            <OrgUnitTree data={treeData} onChange={handleSelect} />

            <div style={{ width: 150 }}>
              <label className="form-label mb-1">ເລືອກປີ</label>
              <input
                type="number"
                className="form-control"
                value={year}
                min="2000"
                max={new Date().getFullYear()}
                onChange={(e) => {
                  setYear(e.target.value);
                  setShowReport(false);
                }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleGenerateReport}
              disabled={!selectedOrg || showReport}
            >
              ເອົາລາຍງານ
            </button>
          </div>

          {showReport && (
  <>


    {/* Event summary */}
    <Page
      orgUnitId={reportParams.orgUnitId}
      year={reportParams.year}
    />
  </>
)}

        </div>
      )}
    </div>
  );
};

export default OrgUnitReport;
