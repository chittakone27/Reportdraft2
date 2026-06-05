import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Spin, message, Modal } from "antd";
import { API_AUTH } from "../config";
import '../App.css'

export default function DatasetApprovalButton({
  orgUnitId,
  Level,
  year,
  quarter,
  Label,
    onSuccess,
confirm,
report,
  dataSetId = "qgtWaPBPH9M",
  dataElementId = "qTAkkfEUI6W"
}) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("None"); // overall status
  const [selfStatus, setSelfStatus] = useState("None"); // selected orgUnit status
  const [posting, setPosting] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const [userLevel, setUserLevel] = useState(null);
  const [childDisabled, setChildDisabled] = useState(false);
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");

  const categoryOptionCombo = "HllvX50cXC0";
  const attributeOptionCombo = "HllvX50cXC0";

  const levelStatus = { 1: "CHO", 2: "PHO", 3: "DHO", 4: "HC" };
  const cancelStatus = { 1: "PHO", 2: "DHO", 3: "HC", 4: "None" };

  const disableRules = {
    4: ["DHO", "PHO", "CHO"],
    3: ["PHO", "CHO"],
    2: ["CHO"],
    1: []
  };

  // ----- Fetch user roles & level -----
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          "https://hfml.gov.la/hfml/api/me?fields=id,username,organisationUnits[level],userRoles[id,name]",
          // { auth: API_AUTH }
        );
        setUserRoles(res.data?.userRoles || []);
        setUserLevel(res.data?.organisationUnits?.[0]?.level);
      } catch (err) {
        console.error("Failed to fetch user info", err);
      }
    };
    fetchUser();
  }, []);

  const isSuperUser = userRoles.some(r => r.id.includes("yrB6vc5Ip3r"));
  const isDataApproval = userRoles.some(r => r.id.includes("snyVZOLMg7N"));
  const canSeeButton = isSuperUser || (isDataApproval && userLevel === Level);

  // ----- Fetch all children recursively -----
  const fetchChildren = async () => {
    try {
      const res = await axios.get(
        `https://hfml.gov.la/hfml/api/29/dataSets/${dataSetId}.json`,
        {
          // auth: API_AUTH,
          params: { fields: "organisationUnits[id,name,level,parent[id]]" }
        }
      );
      const allUnits = res.data?.organisationUnits || [];

      const collectChildren = parentId => {
        const children = allUnits.filter(u => u.parent?.id === parentId);
        let ids = children.map(c => c.id);
        children.forEach(c => {
          ids = ids.concat(collectChildren(c.id));
        });
        return ids;
      };

      return [orgUnitId, ...collectChildren(orgUnitId)]; // include self
    } catch (err) {
      console.error("Failed to fetch children", err);
      message.error("Failed to fetch children");
      return [orgUnitId];
    }
  };

  // ----- Fetch status for single orgUnit -----
  const fetchStatus = async orgId => {
    try {
      const res = await axios.get("https://hfml.gov.la/hfml/api/dataValueSets.json", {
        // auth: API_AUTH,
        params: { dataSet: dataSetId, period: `${year}${quarter}`, orgUnit: orgId }
      });
      const dv = res.data?.dataValues?.find(d => d.dataElement === dataElementId);
      return dv?.value && dv.value !== "None" ? dv.value : "None";
    } catch (err) {
      console.error(err);
      return "Error";
    }
  };

  // ----- Check statuses -----
  const checkStatuses = async () => {
    setLoading(true);
    const ids = await fetchChildren();
    const results = await Promise.all(ids.map(id => fetchStatus(id)));

    const levelStat = levelStatus[Level];
    const allApproved = results.every(v => v === levelStat);
    setStatus(allApproved ? levelStat : "None");

    const self = await fetchStatus(orgUnitId);
    setSelfStatus(self);

    // ----- Child-level disable logic -----
    let disabled = false;
    const childIds = ids.filter(id => id !== orgUnitId); // exclude self

    if (Level === 3) {
      const childStatuses = await Promise.all(childIds.map(id => fetchStatus(id)));
      if (!childStatuses.every(v => v === "HC" || v === "DHO" )) disabled = true;
    } else if (Level === 2) {
      const childStatuses = await Promise.all(childIds.map(id => fetchStatus(id)));
      if (!childStatuses.every(v => v === "DHO" || v === "PHO")) disabled = true;
    } else if (Level === 1) {
      const childStatuses = await Promise.all(childIds.map(id => fetchStatus(id)));
      if (!childStatuses.every(v => v === "CHO" ||  v === "PHO")) disabled = true;
    }
    setChildDisabled(disabled);

    setLoading(false);
  };

  useEffect(() => {
    if (orgUnitId && year && quarter) checkStatuses();
    if(Level === 1){
      setTitle("ສູນກາງ")
    }
      if(Level === 2){
      setTitle("ແຂວງ")
    }  if(Level === 3){
      setTitle("ເມືອງ")
    }  if(Level === 4){
      setTitle("ສຸກສາລາ / ໂຮງໝໍເມືອງ")
    }
  }, [orgUnitId, year, quarter]);

  // ----- Check if button should be disabled -----
  const checkDisabled = () => disableRules[Level].includes(selfStatus);

  // ----- Handle approve/cancel -----
  const handleClick = async () => {
Modal.confirm({
  title: (
    <div style={{ fontFamily: "Noto Sans Lao, sans-serif", fontSize: 18 }}>
      {status === levelStatus[Level]
        ? "ຍົກເລິກປຸ່ມອະນຸມັດ"
        : "ອະນຸມັດ"}
    </div>
  ),

  content: (
    <div style={{ fontFamily: "Noto Sans Lao, sans-serif", fontSize: 16 }}>
      {status === levelStatus[Level]
        ? "ທ່ານແນ່ໃຈບໍ່ວ່າຈະຍົກເລິກປຸ່ມອະນຸມັດ?"
        :   <div style={{ fontFamily: "Noto Sans Lao, sans-serif" }}>
    ຂ້າພະເຈົ້າ, ຜູ້ຮັບຜິດຊອບຂັ້ນ{title}
    <span style={{ fontWeight: "bold" }}> {Label}</span>{" "}
    ຂໍຢັ້ງຢືນວ່າ ຂໍ້ມູນບໍ່ມີການລາຍງານຊໍ້າຊ້ອນ,
    ຖືກຕ້ອງ, ຄົບຖ້ວນ ແລະ ເອກະສານທີ່ສຸກສາລາອັບໂຫຼດແມ່ນໃບຢັ້ງຢືນ
    ຈໍານວນຜູ້ເສຍຊີວິດໃນບ້ານ.
  </div>
      }
    </div>
  ),

  onOk: async () => {
    // your logic here

        setPosting(true);
        try {
          const ids = await fetchChildren();
          const newValue =
            status === levelStatus[Level] ? cancelStatus[Level] : levelStatus[Level];
const today = new Date().toISOString().split("T")[0];
        await Promise.all(
  ids.map(id =>
    axios.post(
      "https://hfml.gov.la/hfml/api/dataValueSets",
      {
        dataSet: "qgtWaPBPH9M",
        completeDate: today,
        period: `${year}${quarter}`,
        orgUnit: id,
        dataValues: [
          {
            dataElement: "qTAkkfEUI6W",
            categoryOptionCombo: "HllvX50cXC0",
            attributeOptionCombo: "HllvX50cXC0",
            value: newValue
          }
        ]
      },
      // { auth: API_AUTH }
    )
  )
);

       message.success(
  <span style={{ fontFamily: "Noto Sans Lao, sans-serif", fontSize: 16 }}>
    {status === levelStatus[Level]
      ? "ຍົກເລິກປຸ່ມອະນຸມັດແລ້ວ"
      : "ອະນຸມັດແລ້ວ"}
  </span>
);
onSuccess && onSuccess();

          checkStatuses();
        } catch (err) {
          console.error(err);
          message.error("Failed to update statuses");
        } finally {
          setPosting(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <div style={{ margin: "20px 0" }}>
        <Spin style={{fontFamily: 'Noto Sans Lao'}} size="small" tip="ກຳລັງໂຫຼດປຸ່ມອະນຸມັດ" />
      </div>
    );
  }

  if (!canSeeButton) return null;


  return (

    <>
        <Button
    style={{marginBottom:"20px"}}
      type="primary"
      danger={status === levelStatus[Level]}
      loading={posting}
      onClick={handleClick}
      disabled={status === "Error" || checkDisabled() || childDisabled}
    >
      {checkDisabled()
        ? "ອະນຸມັດແລ້ວ"
        : status === levelStatus[Level]
        ? "ຍົກເລິກປຸ່ມອະນຸມັດ"
        : "ອະນຸມັດ"}
    </Button>
       </>
  );
}