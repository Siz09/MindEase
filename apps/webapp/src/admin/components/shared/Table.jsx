"use client"

import { useState, useMemo } from "react"

export default function Table({
  columns,
  data,
  sortable = true,
  selectable = false,
  onRowClick = null,
  loading = false,
  empty = "No data available",
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })
  const [selectedRows, setSelectedRows] = useState(new Set())

  const handleSort = (columnKey) => {
    if (!sortable) return
    let direction = "asc"
    if (sortConfig.key === columnKey && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key: columnKey, direction })
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(data.map((_, idx) => idx)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (idx, e) => {
    e.stopPropagation()
    const newSelected = new Set(selectedRows)
    if (newSelected.has(idx)) {
      newSelected.delete(idx)
    } else {
      newSelected.add(idx)
    }
    setSelectedRows(newSelected)
  }

  const sortedData = useMemo(() => {
    const sorted = [...data]
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]

        // Handle null/undefined values
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return 1
        if (bVal == null) return -1

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }
    return sorted
  }, [data, sortConfig])

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {selectable && (
              <th style={{ width: "40px" }}>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedRows.size > 0 && selectedRows.size === data.length}
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                style={{ cursor: sortable ? "pointer" : "default" }}
              >
                {col.label}
                {sortable && sortConfig.key === col.key && (
                  <span style={{ marginLeft: "4px" }}>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} style={{ textAlign: "center" }}>
                Loading...
              </td>
            </tr>
          )}
          {!loading && sortedData.length === 0 && (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} style={{ textAlign: "center" }}>
                {empty}
              </td>
            </tr>
          )}
          {!loading &&
            sortedData.map((row, idx) => {
              const rowKey = row.id || row.key || `row-${idx}`
              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{ cursor: onRowClick ? "pointer" : "default" }}
                >
                {selectable && (
                  <td onClick={(e) => handleSelectRow(idx, e)}>
                    <input type="checkbox" checked={selectedRows.has(idx)} readOnly />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key}>{row[col.key]}</td>
                ))}
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}
