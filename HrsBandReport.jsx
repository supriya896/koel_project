import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function HrsBandReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  const itemsPerPage = 50;
  const listRef = useRef(null);
  const BASE_URL = "https://koelpravesh.kirloskar.com:5300";

  // Fetch report
  const fetchReport = async () => {
    if (!startDate || !endDate) {
      alert("Select both start & end dates");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `${BASE_URL}/api/report/hrsdate-range?from_date=${startDate}&to_date=${endDate}&page=1&limit=5000`
      );

      if (res.data && Array.isArray(res.data.data)) {
        setData(res.data.data);
        setDisplayData(res.data.data.slice(0, itemsPerPage));
      } else {
        setData([]);
        setDisplayData([]);
        alert("No data found for selected range");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  // Lazy loading on scroll
  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;

    if (scrollTop + clientHeight >= scrollHeight - 20) {
      const currentLength = displayData.length;
      const more = filteredData.slice(currentLength, currentLength + itemsPerPage);
      if (more.length > 0) setDisplayData([...displayData, ...more]);
    }
  };

  // Filter by vehicle number
  const filteredData = data.filter((item) =>
    (item.vehicle_number || "").toLowerCase().includes(vehicleNumber.toLowerCase())
  );

  useEffect(() => {
    setDisplayData(filteredData.slice(0, itemsPerPage));
  }, [vehicleNumber, data]);

  // Download Excel
  const downloadExcel = async () => {
    if (!startDate || !endDate) {
      alert("Select date range first");
      return;
    }

    try {
      setDownloading(true);
      const res = await axios.get(
        `${BASE_URL}/download_hrs_report?from_date=${startDate}&to_date=${endDate}`,
        { responseType: "arraybuffer" }
      );
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      // you can change filename here
      link.download = `HrsBand_Report_${startDate}_to_${endDate}.xlsx`;
      link.click();
    } catch (err) {
      console.error("Download error:", err);
      alert("Excel download failed");
    } finally {
      setDownloading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // badge for WITHIN/EXCESS etc.
  const bandBadgeClass = (band) => {
    if (!band) return "text-gray-600";
    if (band === "WITHIN") return "bg-green-600 text-white px-2 py-0.5 rounded text-xs";
    if (band === "EXCESS") return "bg-red-600 text-white px-2 py-0.5 rounded text-xs";
    return "bg-gray-400 text-white px-2 py-0.5 rounded text-xs";
  };

  // styling for total_duration (neutral badge)
  const durationBadgeClass = () => "bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-6">HRS Band Report</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-6 items-end">
        <div className="flex flex-col">
          <label className="font-semibold mb-1">Start Date</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-2 w-48"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label className="font-semibold mb-1">End Date</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-2 w-48"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button
          onClick={fetchReport}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded shadow"
        >
          Search
        </button>

        <button
          onClick={downloadExcel}
          disabled={downloading}
          className={`${
            downloading ? "bg-gray-400 cursor-not-allowed" : "bg-green-700 hover:bg-green-800"
          } text-white px-4 py-2 rounded shadow`}
        >
          {downloading ? "Downloading…" : "Download Excel"}
        </button>
      </div>

      {/* Vehicle filter */}
      {data.length > 0 && (
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search Vehicle No..."
            className="border border-gray-300 rounded px-3 py-2 w-64"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
          />
        </div>
      )}

      {loading && (
        <p className="text-center mt-5 text-sm font-medium">Loading data… ⏳</p>
      )}

      {/* Single column list (same format as Efficiency) */}
      {!loading && displayData.length > 0 && (
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="mt-6 space-y-4 h-[620px] overflow-y-auto pr-2"
        >
          {displayData.map((item) => {
            const dockUsers = item?.dock_details?.map((d) => d.user_dockin).filter(Boolean).join(", ");
            const dockLocations = item?.dock_details?.map((d) => d.docked_location).filter(Boolean).join(", ");
            const dockRemarks = item?.dock_details?.map((d) => d.remarks).filter(Boolean).join(", ");
            const categories = item?.material_categories?.join(", ");

            return (
              <div key={item.trip_id} className="bg-white border rounded-xl shadow p-4 hover:shadow-lg transition">
                {/* Header (same style as Efficiency) */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-blue-700">Trip #{item.trip_id}</h3>
                    <p className="text-sm text-gray-700">
                      <b>Vehicle:</b> {item.vehicle_number || "NA"} &nbsp; | &nbsp;
                      <b>Type:</b> {item.vehicle_type || "NA"}
                    </p>
                  </div>

                  <div className="text-right">
                    {/* Keep efficiency visible (like Efficiency.jsx) */}
                    <p className="text-sm text-gray-700">
                      <b>Efficiency:</b> {item.efficiency != null ? `${item.efficiency}%` : "NA"}
                    </p>
                    <div className={`inline-block mt-1 ${item.efficiency_category ? (item.efficiency_category === "WITHIN" ? "bg-green-600" : "bg-red-600") : "bg-gray-400"} text-white text-xs px-2 py-1 rounded`}>
                      {item.efficiency_category || "NA"}
                    </div>
                  </div>
                </div>

                {/* Primary details */}
                <div className="mt-3 text-sm text-gray-700">
                  <p><b>Transporter:</b> {item.transporter_name || "NA"}</p>
                  <p><b>Material Category:</b> {categories || "NA"}</p>
                  <p><b>Loading/Unloading:</b> {item.loading_unloading || "NA"}</p>
                  <p><b>Driver:</b> {item.driver || "NA"}</p>
                </div>

                {/* Timings & durations grid (same visual grouping as Efficiency) */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1 text-xs sm:text-sm text-gray-700">
                  <p><b>Pravesh Entry:</b> {item.pravesh_entry_time || "NA"}</p>
                  <p><b>Pravesh Exit:</b> {item.pravesh_exit_time || "NA"}</p>
                  <p><b>Trip Duration:</b> {item.trip_duration != null ? `${item.trip_duration} mins` : "NA"}</p>

                  <p><b>Dock In:</b> {item.dock_in_time || "NA"}</p>
                  <p><b>Dock Out:</b> {item.dock_out_time || "NA"}</p>
                  <p><b>Docked Duration:</b> {item.docked_duration != null ? `${item.docked_duration} mins` : "NA"}</p>

                  <p><b>Standard Time:</b> {item.standard_time_duration != null ? `${item.standard_time_duration} mins` : "NA"}</p>
                  <p><b>Exit Remark:</b> {item.exit_remark || "NA"}</p>
                  <p></p>
                </div>

                {/* HRS Band fields placed where Efficiency was */}
                <div className="mt-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div>
                      <b>HRS Band:</b>
                    </div>
                    <div>
                      <span className={bandBadgeClass(item.hrs_band)}>
                        {item.hrs_band || "NA"}
                      </span>
                    </div>

                    <div className="ml-6">
                      <b>Total Duration HRS Band:</b>
                    </div>
                    <div>
                      <span className={durationBadgeClass()}>
                        {item.total_duration_hrs_band || "NA"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dock details summary */}
                <div className="mt-3 text-xs text-gray-700">
                  <p><b>Dock Users:</b> {dockUsers || "NA"}</p>
                  <p><b>Dock Locations:</b> {dockLocations || "NA"}</p>
                  <p><b>Dock Remarks:</b> {dockRemarks || "NA"}</p>
                </div>

                {/* Expandable details (same UX as Efficiency) */}
                <div className="mt-3">
                  <button
                    onClick={() => toggleExpand(item.trip_id)}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-1 rounded"
                  >
                    {expanded[item.trip_id] ? "Hide Dock Details ▲" : "Show Dock Details ▼"}
                  </button>

                  {expanded[item.trip_id] && (
                    <div className="mt-3 bg-gray-100 p-3 rounded-lg text-xs sm:text-sm">
                      {item.dock_details && item.dock_details.length > 0 ? (
                        item.dock_details.map((d, i) => (
                          <div key={i} className="border-b border-gray-300 py-2">
                            <p><b>Docked Location:</b> {d.docked_location || "NA"}</p>
                            <p><b>User Dock-In:</b> {d.user_dockin || "NA"}</p>
                            <p><b>Remarks:</b> {d.remarks || "NA"}</p>
                            <p><b>Material Category:</b> {d.material_category || "NA"}</p>
                          </div>
                        ))
                      ) : (
                        <p>No dock details available.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No data */}
      {!loading && displayData.length === 0 && (
        <p className="mt-10 text-center text-gray-600">No data to display.</p>
      )}
    </div>
  );
}
