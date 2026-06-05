import React, { useEffect, useState } from "react";
import { Table, Space, Alert ,Tag} from "antd";
import axios from "axios";

export default function AggregateTableComparison({
  orgUnitId,
  year,
  quarter,
  Level,
  Confirm,
  Report
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [group, setGroup] = useState("");
  const [aggMap, setAggMap] = useState({});
  const [extraAggMap, setExtraAggMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  // const auth = { username: "", password: "" };
const [confirm, setConfirm] = useState(0);
const [report, setnotreport] = useState(0);
  const [statusitself,setstatusitself] = useState("");

  const getFilters = (data, key) => {
    const uniqueValues = [...new Set(data.map((item) => item[key]).filter(Boolean))];
    return uniqueValues.map((v) => ({ text: v, value: v }));
  };
useEffect(() => {
  if (Level === 1) {
    setGroup("jblbYwuvO33");
    setTitle("ແຂວງ");
  } else if (Level === 2) {
    setGroup("Zh1inFu0Z2O");
    setTitle("ເມືອງ");
  } else if (Level === 3) {
    setGroup("U53tdte60Ku;OU_GROUP-S8nZUO4pUE8");
    setTitle("ຮໝຊ / ສສລ");
  } else if (Level === 4 || Level === 5) {
    setGroup("VBzDcGflr6J");
    setTitle("ບ້ານ");
  }
}, [Level]);
useEffect(() => {
  if (orgUnitId && year && quarter && group) {
    fetchData();
  }
}, [orgUnitId, year, quarter, group]);

  const flattenHierarchy = (unit) => {
    const levels = [];
    let current = unit;
    while (current) {
      levels.unshift({ id: current.id, name: current.displayName });
      current = current.parent;
    }
    return levels;
  };

  const mapVillagesByLevel = (villages, events, targetLevelIndex, parentOrgUnitId) => {
    const villagesWithEvent = new Set(events.map((r) => r[16]));
    const counts = {};
    villages.forEach((v) => {
      const hierarchy = flattenHierarchy(v);
      const target = hierarchy[targetLevelIndex];
      if (!target) return;
      if (!parentOrgUnitId || hierarchy.some((h) => h.id === parentOrgUnitId)) {
        counts[target.id] = counts[target.id] || { 
          id: target.id,
          ou: target.name,
          value: 0,
          cdcFormValue: 0,
        };
        if (!villagesWithEvent.has(v.id)) counts[target.id].value += 1;
      }
    });
    return Object.values(counts);
  };

const fetchStatusForOrgUnits = async (orgUnits) => {
  const tempMap = {};

  await Promise.all(
    orgUnits.map(async (row) => {
      try {
        const res = await axios.get(
          `https://hfml.gov.la/hfml/api/dataValueSets.json`,
          {
            // auth,
            params: {
              dataSet: "qgtWaPBPH9M",
              period: `${year}${quarter}`,
              orgUnit: row.id
            }
          }
        );

        const dataValues = res.data.dataValues || [];
        let approved = false;

        if (Level === 4) {
          approved = dataValues.some(
            (d) => d.value && d.value.toLowerCase() !== "none"
          );
        } else if (Level === 3) {
          approved = dataValues.some(
            (d) => d.value && d.value.toLowerCase() == "hc" || d.value.toLowerCase() == "dho" || d.value.toLowerCase() == "pho" || d.value.toLowerCase() == "cho"
          );
        } else if (Level === 2) {
          approved = dataValues.some(
            (d) => d.value && d.value.toLowerCase() == "dho" || d.value.toLowerCase() == "pho" || d.value.toLowerCase() == "cho"
          
          );
        }else if (Level === 1) {
          approved = dataValues.some(
            (d) => d.value && d.value.toLowerCase() == "pho" || d.value.toLowerCase() == "cho"
          );
        }

        tempMap[row.id] = approved ? "ອະນຸມັດແລ້ວ" : "ຍັງບໍ່ທັນໄດ້ອະນຸມັດ";
      } catch (err) {
        console.error("Error fetching status for", row.id, err);
        tempMap[row.id] = "";
      }
    })

    
  );

  setStatusMap(tempMap);
};

const fetchStatusForitself = async () => {
  try {
    const res = await axios.get(
      "https://hfml.gov.la/hfml/api/dataValueSets.json",
      {
        // auth,
        params: {
          dataSet: "qgtWaPBPH9M",
          period: `${year}${quarter}`,
          orgUnit: orgUnitId,
        },
      }
    );

    const dataValues = res.data.dataValues || [];

    if (dataValues.length > 0) {
      const value = dataValues[0].value;

      if (
        Level === 3 &&
        (value == "DHO" || value == "PHO" || value == "CHO")
      ) {
        setstatusitself("ອະນຸມັດແລ້ວ");
      }
      else if (
        Level === 2 &&
        (value == "PHO" || value == "CHO")
      ) {
        setstatusitself("ອະນຸມັດແລ້ວ");
      }
      else if (Level === 1 && value == "CHO") {
        setstatusitself("ອະນຸມັດແລ້ວ");
      }
      else {
        setstatusitself("ຍັງບໍ່ທັນໄດ້ອະນຸມັດ");
      }
    }

  } catch (error) {
    console.error("Error:", error);
  }
};
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1️⃣ Fetch hierarchy
      const orgRes = await axios.get(
        "https://hfml.gov.la/hfml/api/29/programs/boVqBGuZM22.json",
        {
          // auth,
          params: {
            fields:
              "organisationUnits[id,name,displayName,level,parent[id,name,displayName,level,parent[id,name,displayName,level,parent[id,name,displayName,level,parent[id,name,displayName,level]]]]",
          },
        }
      );
      const villages = orgRes.data.organisationUnits;

      // 2️⃣ Fetch events
      const eventRes = await axios.get(
        "https://hfml.gov.la/hfml/api/29/analytics/events/query/rcdeBTSHHpW.json",
        {
          // auth,
          params: {
            dimension: [`pe:${year}${quarter}`, `ou:${orgUnitId}`],
            stage: "CZr2TZIrIsG",
            outputType: "EVENT",
            paging: false,
          },
        }
      );
      const rows = eventRes.data.rows || [];


      // 4️⃣ Fetch CDC aggregate values
      const aggRes = await axios.get(
        "https://hfml.gov.la/hfml/api/29/analytics/events/aggregate/boVqBGuZM22.json",
        {
          // auth,
          params: {
            dimension: [`pe:${year}${quarter}`, `ou:OU_GROUP-${group};${orgUnitId}`],
            filter:"HTAnNzvPNQi.EnTm3aFU6X0",
            stage: "HTAnNzvPNQi",
            displayProperty: "NAME",
            totalPages: false,
            outputType: "EVENT",
          },
        }
      );
      const aggHeaders = aggRes.data.headers || [];
      const aggRows = aggRes.data.rows || [];
      const ouIndex = aggHeaders.findIndex(h => h.name === "ou");
      const valueIndex = aggHeaders.findIndex(h => h.name === "value");
      const aggMapTemp = {};
      aggRows.forEach((r) => {
        const villageId = r[ouIndex];
        const value = Number(r[valueIndex] || 0);
        aggMapTemp[villageId] = value;
      });
      setAggMap(aggMapTemp);

      // 5️⃣ Fetch next column API (extra aggregate)
  const extraAggRes = await axios.get(
  "https://hfml.gov.la/hfml/api/analytics.json",
  {
    // auth,
    params: {
      dimension: [
        "dx:rcdeBTSHHpW.BW5YCOa96T5",
        `ou:${orgUnitId};OU_GROUP-${group}`,
      ],
      filter: `pe:${year}${quarter}`,
      showHierarchy: false,
      hierarchyMeta: false,
      includeMetadataDetails: true,
      includeNumDen: true,
      skipRounding: false,
      completedOnly: false,
      outputIdScheme: "UID",
    },
  }
);
      const extraAggHeaders = extraAggRes.data.headers || [];
      const extraAggRows = extraAggRes.data.rows || [];
      const extraOuIndex = extraAggHeaders.findIndex(h => h.name === "ou");
      const extraValueIndex = extraAggHeaders.findIndex(h => h.name === "value");
      const extraAggMapTemp = {};
      extraAggRows.forEach((r) => {
        const villageId = r[extraOuIndex];
        const value = Number(r[extraValueIndex] || 0);
        extraAggMapTemp[villageId] = value;
      });
      setExtraAggMap(extraAggMapTemp);

      // 6️⃣ Map villages without events
      let targetLevelIndex;
      if (Level === 1) targetLevelIndex = 1;
      else if (Level === 2) targetLevelIndex = 2;
      else if (Level === 3) targetLevelIndex = 3;
      else if (Level === 4 || Level === 5) targetLevelIndex = 4;

      const tableRows = mapVillagesByLevel(villages, rows, targetLevelIndex, orgUnitId);

      // 7️⃣ Merge CDC & extra aggregate
      const mergedRows = tableRows.map((row) => {
        const reportedByForm = aggMapTemp[row.id];
        const actualDeaths = extraAggMapTemp[row.id];

        return {
          ...row,
          reportedValue: reportedByForm,
          extraValue: actualDeaths,
          key: row.id,
        };
      });

      setData(mergedRows);
      setConfirm(mergedRows.reduce((acc, r) => acc + r.value, 0));

      // ✅ Fetch Status for each org unit in table
      fetchStatusForOrgUnits(mergedRows);
      fetchStatusForitself();


    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: title,
      dataIndex: "ou",
      key: "ou",
      filters: getFilters(data, "ou"),
      onFilter: (value, record) => record.ou === value,
    },
    {
      title: "ຈໍານວນບ້ານທີ່ຍັງບໍ່ໄດ້ຢັ້ງຢືນ",
      dataIndex: "value",
      key: "value",
      render: (value) =>
        value <= 0 ? (
  <Tag color={"green"} style={{ fontWeight: "bold" }}>
        ຄົບແລ້ວ
      </Tag>        ) : (
          <span style={{ color: "red", fontWeight: "bold" }}>{value}</span>
        ),
    },
    {
      title: "ຈໍານວນຜູ້ເສຍຊີວິດທີ່ຍັງບໍ່ໄດ້ລາຍງານ",
      key: "cdcFormValue",
      render: (_, record) => {
        const reported = record.reportedValue;
        const actual = record.extraValue;

        if (reported === undefined && actual === undefined) return "";

        // const diff =(reported || 0) - (actual || 0) ;
        console.log(reported , actual ,reported-actual)
        const diff =(reported || 0) - (actual || 0) ;

      //   if (diff <= 0 && record.value <= 0) {
      //     return (
      //        <Tag color={"green"} style={{ fontWeight: "bold" }}>
      //   ຄົບແລ້ວ
      // </Tag>
      //     );
      //   }

        return (
          <span style={{ color: "red", fontWeight: "bold" }}>
            {diff}
          </span>
        );
      },
    },
{
  title: "ອະນຸມັດຂັ້ນສຸກສາລາ",
  key: "status",
  render: (_, record) => {
    const status = statusMap[record.id];
    let color = "";

    if (status === "ອະນຸມັດແລ້ວ") color = "green";
    else if (status === "ຍັງບໍ່ທັນໄດ້ອະນຸມັດ") color = "red";

    return status ? (
      <Tag color={color} style={{ fontWeight: "bold" }}>
        {status}
      </Tag>
    ) : null;
  }
}
  ];
useEffect(() => {
  const total = data.reduce((acc, r) => acc + (r.value || 0), 0);

  const totalCdc = data.reduce((acc, r) => {
    const reported = r.reportedValue;
    const actual = r.extraValue;

    if (reported === undefined && actual === undefined) return acc;

    return acc + ((actual || 0) - (reported || 0));
  }, 0);

  setConfirm(total);
  setnotreport(totalCdc);

  // ✅ send to parent safely
  if (Confirm) Confirm(total);
  if (Report) Report(totalCdc);

}, [data]);
const summary = () => {
  const overallStatus = statusitself;

  let statusColor = "";
  if (overallStatus === "ອະນຸມັດແລ້ວ") statusColor = "green";
  else if (overallStatus === "ຍັງບໍ່ທັນໄດ້ອະນຸມັດ") statusColor = "red";

  return (
    <Table.Summary.Row>
      <Table.Summary.Cell index={0}><b>ທັງໝົດ</b></Table.Summary.Cell>

      <Table.Summary.Cell index={1}>
        {confirm <= 0 ? (
          <Tag color="green" style={{fontWeight: "bold" }}>ຄົບແລ້ວ</Tag>
        ) : (
          <span style={{ color: "red", fontWeight: "bold" }}>{confirm}</span>
        )}
      </Table.Summary.Cell>

      <Table.Summary.Cell index={2}>
        {report <= 0 && confirm <= 0 ? (
          <Tag color="green">ຄົບແລ້ວ</Tag>
        ) : (
          <span style={{ color: "red", fontWeight: "bold" }}>{report}</span>
        )}
      </Table.Summary.Cell>

      <Table.Summary.Cell index={3}>
        {overallStatus ? (
          <Tag color={statusColor} style={{fontWeight: "bold" }}>{overallStatus}</Tag>
        ) : (
          "-"
        )}
      </Table.Summary.Cell>
    </Table.Summary.Row>
  );
};
  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {/* <h1>{label}</h1>
      {Level !== 5 && (
        <AggregateApproval
          orgUnitId={orgUnitId}
          year={year}
          quarter={quarter}
          Level={Level}
        />
      )} */}
      <Alert
        message={<div style={{ fontFamily: "'Noto Sans Lao', sans-serif", fontWeight: "bold" }}>ຄໍາເຕືອນ:</div>}
        description={
          <div style={{ fontFamily: "'Noto Sans Lao', sans-serif" }}>
            <p>ຈໍານວນບ້ານທີ່ຍັງບໍ່ໄດ້ຢັ້ງຢືນຈໍານວນຜູ້ເສຍຊີວິດມີທັງໝົດ{" "}
            <span style={{ color: "red", fontWeight: "bold" }}>{confirm}</span> ບ້ານ.</p>
            <p>ຈໍານວນຜູ້ເສຍຊີວິດທີ່ຍັງບໍ່ໄດ້ລາຍງານຂໍ້ມູນມີທັງໝົດ {" "}
            <span style={{ color: "red", fontWeight: "bold" }}>{report}</span> ຄົນ.</p>
          </div>
        }
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
      />
      {/* { Level  < 4 &&( */}
      <Table
        style={{ marginBottom: "90px" }}
        columns={columns}
        dataSource={data}
        bordered
        pagination={false}
        loading={loading}
        summary={summary}
        rowKey="id"
      />
       {/* )}  */}
    </Space>
  );
}