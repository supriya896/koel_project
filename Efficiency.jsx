import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function ReportWithRange() {
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
        `${BASE_URL}/api/report/date-range?from_date=${startDate}&to_date=${endDate}&page=1&limit=5000`
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
      alert("Failed to fetch report");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lazy loading
  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;

    if (scrollTop + clientHeight >= scrollHeight - 10) {
      const currentLength = displayData.length;
      const more = filteredData.slice(
        currentLength,
        currentLength + itemsPerPage
      );
      if (more.length > 0) setDisplayData([...displayData, ...more]);
    }
  };

  // Filter by vehicle
  const filteredData = data.filter((item) =>
    (item.vehicle_number || "")
      .toLowerCase()
      .includes(vehicleNumber.toLowerCase())
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
      setDownloading(true); // block button

      const res = await axios.get(
        `${BASE_URL}/download_trip_report?from_date=${startDate}&to_date=${endDate}`,
        { responseType: "arraybuffer" }
      );

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Trip_Report_${startDate}_to_${endDate}.xlsx`;
      link.click();
    } catch (err) {
      alert("Excel download failed");
      console.error(err);
    } finally {
      setDownloading(false); // enable button again
    }
  };

  // Toggle dock expand
  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Style helper for efficiency badges
  const efficiencyStyle = (cat) => {
    if (cat === "WITHIN")
      return "bg-green-600 text-white px-2 py-1 rounded text-xs";
    if (cat === "EXCESS")
      return "bg-red-600 text-white px-2 py-1 rounded text-xs";
    return "bg-gray-400 text-white px-2 py-1 rounded text-xs";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">
        📦 Trip Performance Report
      </h2>

      {/* Date Filters */}
      <div className="flex flex-wrap gap-6 items-end">
        <div className="flex flex-col">
          <label className="font-semibold mb-1">Start Date</label>
          <input
            type="date"
            className="border border-gray-400 rounded px-3 py-2 w-48"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="font-semibold mb-1">End Date</label>
          <input
            type="date"
            className="border border-gray-400 rounded px-3 py-2 w-48"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button
          onClick={fetchReport}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow"
        >
          Search
        </button>

        <button
          onClick={downloadExcel}
          disabled={downloading}
          className={`${
            downloading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          } text-white font-semibold px-5 py-2 rounded shadow`}
        >
          {downloading ? "Downloading… ⏳" : "Download Excel ⬇️"}
        </button>
      </div>

      {/* Vehicle filter */}
      {data.length > 0 && (
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search Vehicle No..."
            className="border border-gray-400 rounded px-3 py-2 w-64"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
          />
        </div>
      )}

      {loading && (
        <p className="text-center mt-5 font-semibold">Loading data… ⏳</p>
      )}

      {/* Cards List */}
      {!loading && displayData.length > 0 && (
        <div
          className="mt-6 space-y-4 h-[600px] overflow-y-auto pr-2"
          ref={listRef}
          onScroll={handleScroll}
        >
          {displayData.map((item) => {
            const dockUsers = item?.dock_details
              ?.map((d) => d.user_dockin)
              .filter(Boolean)
              .join(", ");
            const dockLocations = item?.dock_details
              ?.map((d) => d.docked_location)
              .filter(Boolean)
              .join(", ");
            const dockRemarks = item?.dock_details
              ?.map((d) => d.remarks)
              .filter(Boolean)
              .join(", ");
            const categories = item?.material_categories?.join(", ");

            return (
              <div
                key={item.trip_id}
                className="border border-gray-300 rounded-xl p-4 shadow bg-white hover:shadow-lg transition"
              >
                {/* Header Row */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">
                      🚛 Trip #{item.trip_id}
                    </h3>
                    <p className="text-sm text-gray-700">
                      <b>Vehicle:</b> {item.vehicle_number} &nbsp; | &nbsp;
                      <b>Type:</b> {item.vehicle_type} &nbsp; | &nbsp;
                      <b>Transporter:</b> {item.transporter_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      <b>Efficiency:</b> {item.efficiency ?? "NA"}%
                    </p>
                    <span className={efficiencyStyle(item.efficiency_category)}>
                      {item.efficiency_category || "NA"}
                    </span>
                  </div>
                </div>

                {/* Material & Driver */}
                <div className="mt-2 text-sm">
                  <p>
                    <b>Material Category:</b> {categories || "NA"}
                  </p>
                  <p>
                    <b>Loading / Unloading:</b> {item.loading_unloading || "NA"}
                  </p>
                  <p>
                    <b>Driver:</b> {item.driver || "NA"}
                  </p>
                </div>

                {/* TIMESTAMPS + DURATIONS GRID */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1 text-xs sm:text-sm">
                  <p>
                    <b>Pravesh Entry:</b> {item.pravesh_entry_time || "NA"}
                  </p>
                  <p>
                    <b>Dock In:</b> {item.dock_in_time || "NA"}
                  </p>
                  <p>
                    <b>Dock Out:</b> {item.dock_out_time || "NA"}
                  </p>
                  <p>
                    <b>Pravesh Exit:</b> {item.pravesh_exit_time || "NA"}
                  </p>
                  <p>
                    <b>Trip Duration:</b>{" "}
                    {item.trip_duration != null
                      ? `${item.trip_duration} mins`
                      : "NA"}
                  </p>
                  <p>
                    <b>Docked Duration:</b>{" "}
                    {item.docked_duration != null
                      ? `${item.docked_duration} mins`
                      : "NA"}
                  </p>
                  <p>
                    <b>Standard Time:</b>{" "}
                    {item.standard_time_duration != null
                      ? `${item.standard_time_duration} mins`
                      : "NA"}
                  </p>
                </div>

                {/* Aggregated dock info */}
                <div className="mt-3 text-sm">
                  <p>
                    <b>Dock Users:</b> {dockUsers || "NA"}
                  </p>
                  <p>
                    <b>Docked Locations:</b> {dockLocations || "NA"}
                  </p>
                  <p>
                    <b>Dock Remarks:</b> {dockRemarks || "NA"}
                  </p>
                  <p>
                    <b>Exit Remark:</b> {item.exit_remark || "NA"}
                  </p>
                </div>

                {/* Expandable raw dock rows */}
                <button
                  className="mt-3 bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-1 rounded"
                  onClick={() => toggleExpand(item.trip_id)}
                >
                  {expanded[item.trip_id]
                    ? "Hide Dock Details ▲"
                    : "Show Dock Details ▼"}
                </button>

                {expanded[item.trip_id] && (
                  <div className="mt-3 bg-gray-100 p-3 rounded-lg text-xs sm:text-sm">
                    {item.dock_details && item.dock_details.length > 0 ? (
                      item.dock_details.map((d, i) => (
                        <div
                          key={i}
                          className="border-b border-gray-300 py-2 last:border-b-0"
                        >
                          <p>
                            <b>Docked Location:</b> {d.docked_location || "NA"}
                          </p>
                          <p>
                            <b>User Dock-In:</b> {d.user_dockin || "NA"}
                          </p>
                          <p>
                            <b>Remarks:</b> {d.remarks || "NA"}
                          </p>
                          <p>
                            <b>Material Category:</b>{" "}
                            {d.material_category || "NA"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p>No dock details available.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && !displayData.length && data.length === 0 && (
        <p className="mt-6 text-center text-gray-600 font-medium">
          No data to display.
        </p>
      )}
    </div>
  );
}
