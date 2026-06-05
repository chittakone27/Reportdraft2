import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Modal, Button, Spin ,Select, Space,Card,Tag} from "antd";
// import ApprovalTable from './approvalTable'
const { Option } = Select;
const LineList = ({ orgUnitId, year, quarter, level, Label ,refreshKey}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    province: "",
    district: "",
    facility: "",
    village: "",
  });
  const [fileType, setFileType] = useState("pdf");
  const [modalLoading, setModalLoading] = useState(false);
  const [aggData, setAggData] = useState({});
  const [group, setGroup] = useState();
  const [Title, setTitle] = useState();
  const [zoom, setZoom] = useState(80);

const [cdcFilter, setCdcFilter] = useState("");
  const API_EVENTS =
    "https://hfml.gov.la/hfml/api/29/analytics/events/query/rcdeBTSHHpW.json";
  const API_PROGRAM =
    "https://hfml.gov.la/hfml/api/29/programs/boVqBGuZM22.json";

  // const auth = { username: "", password: "" };

  const getFilters = (data, key) => {
    const uniqueValues = [...new Set(data.map((item) => item[key]).filter(Boolean))];
    if (!uniqueValues.length && key === "value") return [{ text: "ຍັງບໍ່ລາຍງານ", value: "" }];
    return uniqueValues.map((v) => ({ text: v || "ຍັງບໍ່ລາຍງານ", value: String(v || "") }));
  };

  const fetchAllVillages = async () => {
    const res = await axios.get(API_PROGRAM, {
      // auth,
      params: {
        fields:
          "organisationUnits[id,displayName,level,parent[id,displayName,level,parent[id,displayName,level,parent[id,displayName,level,parent[id,displayName,level]]]]]",
      },
    });

    const allVillages = res.data.organisationUnits.filter((u) => u.level === 5);

    const filtered = allVillages.filter((v) => {
      if (level === 2) return v.parent?.parent?.parent?.id === orgUnitId;
      if (level === 3) return v.parent?.parent?.id === orgUnitId;
      if (level === 4) return v.parent?.id === orgUnitId;
      if (level === 5) return v.id === orgUnitId;
      return true;
    });

    return filtered.map((v) => ({
      villageID: v.id,
      village: v.displayName,
      facility: v.parent?.displayName || "",
      district: v.parent?.parent?.displayName || "",
      province: v.parent?.parent?.parent?.displayName || "",
    }));
  };

  useEffect(() => {
    if (!orgUnitId) return;

    if (level === 1) setGroup("jblbYwuvO33"), setTitle("ແຂວງ");
    else if (level === 2) setGroup("Zh1inFu0Z2O"), setTitle("ເມືອງ");
    else if (level === 3) setGroup("U53tdte60Ku;OU_GROUP-S8nZUO4pUE8"), setTitle("ຮໝຊ / ສສລ");
    else if (level === 4 || level === 5) setGroup("VBzDcGflr6J"), setTitle("ບ້ານ");

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(API_EVENTS, {
          // auth,
          params: {
            dimension: [
              `pe:${year}${quarter}`,
              `ou:${orgUnitId}`,
              "CZr2TZIrIsG.Yosu3mtX9Tz",
              "CZr2TZIrIsG.BW5YCOa96T5",
            ],
            stage: "CZr2TZIrIsG",
            outputType: "EVENT",
            paging: false,
          },
        });
        const rows = res.data.rows || [];

        const aggRes = await axios.get(
          "https://hfml.gov.la/hfml/api/29/analytics/events/aggregate/boVqBGuZM22.json",
          {
            // auth,
            params: {
              dimension: [`pe:${year}${quarter}`, `ou:OU_GROUP-VBzDcGflr6J;${orgUnitId}`],
              filter:"HTAnNzvPNQi.EnTm3aFU6X0",
              stage: "HTAnNzvPNQi",
              displayProperty: "NAME",
              totalPages: false,
              outputType: "EVENT",
            },
          }
        );

     const headers = aggRes.data.headers || [];
const rowsAgg = aggRes.data.rows || [];

const ouIndex = headers.findIndex(h => h.name === "ou");
const valueIndex = headers.findIndex(h => h.name === "value");

const aggMap = {};
rowsAgg.forEach((r) => {
  const villageID = r[ouIndex];
  const value = Number(r[valueIndex] || 0);
  aggMap[villageID] = value;
});
        setAggData(aggMap);

        const villages = await fetchAllVillages();
        const tableData = villages.map((village, index) => {
          const eventRow = rows.find((r) => r[16] === village.villageID);
          const value = eventRow ? parseFloat(eventRow[17]) : null;
          const cdcFormValue = aggMap[village.villageID] || "";
          return {
            key: index,
            eventId: eventRow?.[0] || null,
            province: village.province,
            district: village.district,
            facility: village.facility,
            village: village.village,
            villageID: village.villageID,
            value,
            cdcFormValue,
          };
        });

        setData(tableData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orgUnitId, year, quarter,refreshKey]);
const filteredData = data.filter((record) => {
  if (!cdcFilter) return true; // no filter, show all
  if (cdcFilter === "hasValue") {
    return record.value !== null && record.value !== undefined ||
           record.cdcFormValue !== null && record.cdcFormValue !== undefined && record.cdcFormValue !== "";
  } 
  if (cdcFilter === "noValue") {
    return (record.value === null || record.value === undefined) &&
           (record.cdcFormValue === null || record.cdcFormValue === undefined || record.cdcFormValue === "");
  }
  return true;
});
  const fetchPdfBlob = async (eventId, dataElementUid) => {
    const res = await axios.get(
      `https://hfml.gov.la/hfml/api/events/files?eventUid=${eventId}&dataElementUid=${dataElementUid}`,
      // { auth, responseType: "blob" }
      { responseType: "blob" }
    );

    const type = res.data.type;
    setFileType(type.includes("pdf") ? "pdf" : "image");
    return URL.createObjectURL(res.data);
  };

  const columns = [
    { title: "ແຂວງ", dataIndex: "province", filters: getFilters(data, "province"), onFilter: (v,r) => r.province===v },
    { title: "ເມືອງ", dataIndex: "district", filters: getFilters(data, "district"), onFilter: (v,r) => r.district===v },
    { title: "ສະຖານທີ່ບໍລິການ", dataIndex: "facility", filters: getFilters(data, "facility"), onFilter: (v,r) => r.facility===v },
    { title: "ບ້ານ", dataIndex: "village", filters: getFilters(data, "village"), onFilter: (v,r) => r.village===v },
    {
      title: "ໃບຢັ້ງຢືນການເສຍຊີວິດ",
      render: (_, record) => (
        <Button type="link" onClick={async () => {
          setSelectedLocation({
            province: record.province,
            district: record.district,
            facility: record.facility,
            village: record.village,
          });
          if (!record.eventId) {
            setPdfUrl(""); setFileType(""); setIsModalVisible(true); return;
          }
          setModalLoading(true); setIsModalVisible(true);
          try { const blobUrl = await fetchPdfBlob(record.eventId, "Yosu3mtX9Tz"); setPdfUrl(blobUrl); }
          catch (err) { console.error(err); setPdfUrl(""); }
          finally { setModalLoading(false); }
        }}>
          ເປີດເອກະສານ
        </Button>
      ),

    },
    {
      title: "ຈຳນວນຜູ້ເສຍຊີວິດທັງໝົດ",
      dataIndex: "value",
 
    },
    {
      title: "ຈຳນວນຜູ້ເສຍຊີວິດທີ່ໄດ້ລາຍງານຂໍ້ມູນ",
      dataIndex: "cdcFormValue",
     
    },
{
  title: "ຈຳນວນຜູ້ເສຍຊີວິດທີ່ຍັງບໍ່ໄດ້ລາຍງານຂໍ້ມູນ",
  render: (_, record) => {
    if (record.value == null && record.cdcFormValue == "") {
      return (
        <Tag color="red" style={{ fontWeight: "bold" }}>
          ຍັງບໍ່ລາຍງານ
        </Tag>
      );
    }
    console.log("value",record.value)
    console.log("cdcFormValue",record.cdcFormValue)


    const diff = (record.cdcFormValue || 0) - (record.value || 0)  ;
    console.log(diff)

    return (
      <Tag color={diff == 0 ? "green" : "red"} style={{ fontWeight: "bold" }}>
        {record.cdcFormValue == record.value ? "ຄົບແລ້ວ" : diff}
      </Tag>
    );
  },
}
  ];

  return (
    <>
 
        <Card   style={{
    marginBottom: "20px",
    background: "#e6f7ff",
    color: "#0050b3",
    border: "1px solid #91d5ff",
    fontFamily: "'Noto Sans Lao', sans-serif",
  }}>
<Space style={{ marginBottom: 16,fontFamily: "'Noto Sans Lao', sans-serif" }}>
    <span>ລາຍລະອຽດບ້ານ :</span>
  <Select
    value={cdcFilter}
    onChange={(value) => setCdcFilter(value)}
    placeholder="ທັງໝົດ"
    style={{ width: 300 }}
    allowClear
  >
    <Option value="">ທັງໝົດ</Option>
    <Option value="hasValue">ທີມີຈໍານວນລາຍງານ</Option>
    <Option value="noValue">ທີຍັງມີຈໍານວນລາຍງານ</Option>
  </Select>
</Space>
</Card>
      <Table
  columns={columns}
  dataSource={filteredData}
  loading={loading}
  pagination= {false}
  bordered
  scroll={{ x: 1000 }}
summary={(pageData) => {
  let total = 0;
  let totalCDC = 0;
  let totalDiff = 0;

  let hasAnyData = false;

  pageData.forEach((record) => {
    const v = record.value;
    const c = record.cdcFormValue;

    if (v == null && c == null) return;

    hasAnyData = true;

    total += Number(v || 0);
    totalCDC += Number(c || 0);

    const diff = (c || 0) - (v || 0);

    totalDiff += diff;
  });

  let statusText = "";
  let statusColor = "red";

  if (!hasAnyData) {
    statusText = "ຍັງບໍ່ລາຍງານ";
  } else if (totalDiff === 0) {
    statusText = "ຄົບແລ້ວ";
    statusColor = "green";
  } else {
    statusText = totalDiff;
  }

  return (
    <Table.Summary.Row>
      <Table.Summary.Cell index={0} colSpan={5}>
        <b>ທັງໝົດ</b>
      </Table.Summary.Cell>

      <Table.Summary.Cell index={5}>
        <b>{hasAnyData ? total : "-"}</b>
      </Table.Summary.Cell>

      <Table.Summary.Cell index={6}>
        <b>{hasAnyData ? totalCDC : "-"}</b>
      </Table.Summary.Cell>

      <Table.Summary.Cell index={7}>
        <Tag color={statusColor} style={{ fontWeight: "bold" }}>
          {statusText}
        </Tag>
      </Table.Summary.Cell>
    </Table.Summary.Row>
  );
}}
/>
      <Modal
        title={`View Document - ${selectedLocation.province} / ${selectedLocation.district} / ${selectedLocation.facility} / ${selectedLocation.village}`}
        open={isModalVisible}
        onCancel={()=>setIsModalVisible(false)}
        footer={null}
        width="90%"
        style={{ top:50 }}
        bodyStyle={{ height:"80vh", display:"flex", flexDirection:"column", padding:10 }}
      >
        {modalLoading ? (
          <Spin size="large" style={{margin:"auto"}} />
        ) : (
          <>
            <div style={{ marginBottom:10, textAlign:"right" }}>
              <Button onClick={()=>setZoom(z=>Math.max(z-10,30))}>-</Button>
              <span style={{margin:"0 10px"}}>{zoom}%</span>
              <Button onClick={()=>setZoom(z=>Math.min(z+10,200))}>+</Button>
            </div>
            {fileType==="pdf" ? (
              <iframe src={`${pdfUrl}#zoom=${zoom}`} style={{ height:"100%", width:"100%", border:"none" }}/>
            ):(
              <div style={{ width:"100%", height:"100%", overflow:"auto", textAlign:"center" }}>
                <img src={pdfUrl} alt="preview" style={{ transform:`scale(${zoom/100})`, transformOrigin:"top center"}} />
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
};

export default LineList;