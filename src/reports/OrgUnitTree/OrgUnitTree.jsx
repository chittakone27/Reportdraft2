import React, { useMemo } from "react";
import DropdownTreeSelect from "react-dropdown-tree-select";
import "react-dropdown-tree-select/dist/styles.css";
import "./OrgUnitTree.css";

const OrgUnitTree = ({ data = [], onChange }) => {
  const sortedData = useMemo(() => {
    const sortTree = (nodes = []) =>
      nodes
        .map((n) => ({
          ...n,
          children: n.children ? sortTree(n.children) : [],
          // DO NOT set expanded: remove this property entirely
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    return sortTree(data);
  }, [data]);

  return (
    <div style={{ fontFamily: "'Noto Sans Lao', sans-serif" }}>
      <label className="form-label mb-1">ເລືອກໂຄງຮ່າງການຈັດຕັ້ງ</label>
      <DropdownTreeSelect
        data={sortedData}
        onChange={onChange}
        mode="radioSelect"
        keepTreeOnSearch
        placeholder="Select an Org Unit"
        className="w-100 custom-dropdown"
      />
    </div>
  );
};

export default OrgUnitTree;
