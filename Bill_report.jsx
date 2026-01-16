import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReportNavbar from "../../components/ReportNavbar";

export default function ReportWithRange() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [loading, setLoading] = useState(false);

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
        `${BASE_URL}/get_report?startDate=${startDate}&endDate=${endDate}`
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

  // Lazy load
  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      const currentLength = displayData.length;
      const more = filteredData.slice(currentLength, currentLength + itemsPerPage);
      if (more.length > 0) setDisplayData([...displayData, ...more]);
    }
  };

  // Filter by vehicle
  const filteredData = data.filter((item) =>
    item["Vehicle No"].toLowerCase().includes(vehicleNumber.toLowerCase())
  );

  useEffect(() => {
    setDisplayData(filteredData.slice(0, itemsPerPage));
  }, [vehicleNumber, data]);

  // Full report download
  const downloadExcel = async () => {
    if (!startDate || !endDate) return alert("Select date range first");
    try {
      const res = await axios.get(
        `${BASE_URL}/download_report?startDate=${startDate}&endDate=${endDate}`,
        { responseType: "arraybuffer" }
      );
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Report_${startDate}_to_${endDate}.xlsx`;
      link.click();
    } catch (err) {
      alert("Excel Download Failed");
      console.error(err);
    }
  };

  // Vehicle download (partial match)
  const downloadVehicleExcel = async () => {
    if (!startDate || !endDate || !vehicleNumber) {
      alert("Select date range and enter vehicle number");
      return;
    }
    try {
      const res = await axios.get(
        `${BASE_URL}/download_report_vehicle?startDate=${startDate}&endDate=${endDate}&vehicleNumber=${vehicleNumber}`,
        { responseType: "arraybuffer" }
      );
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Report_${vehicleNumber}_${startDate}_to_${endDate}.xlsx`;
      link.click();
    } catch (err) {
      alert("Vehicle Excel Download Failed");
      console.error(err);
    }
  };

  return (
    <>
    <ReportNavbar />
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">
        📌 Report – Date Range Filter
      </h2>

      {/* Date Range Panel */}
      <div className="flex flex-wrap gap-6 items-end">
        <div className="flex flex-col">
          <label className="font-semibold mb-1">Start Date</label>
          <input
            type="date"
            className="border border-gray-400 rounded px-3 py-2 w-48 focus:ring-2 focus:ring-blue-500"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="font-semibold mb-1">End Date</label>
          <input
            type="date"
            className="border border-gray-400 rounded px-3 py-2 w-48 focus:ring-2 focus:ring-blue-500"
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
      </div>

      {/* Download Full Report */}
      <div className="mt-4">
        <button
          onClick={downloadExcel}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded shadow"
        >
          Download Full Excel
        </button>
      </div>

      {/* Loader */}
      {loading && <p className="text-center mt-5 font-semibold">Loading data… ⏳</p>}

      {/* Vehicle search & table */}
      {data.length > 0 && !loading && (
        <>
          <div className="mt-4 flex flex-wrap gap-2 items-end">
            <input
              type="text"
              placeholder="Search Vehicle & Download"
              className="border border-gray-400 rounded px-3 py-2 w-64 focus:ring-2 focus:ring-purple-500"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
            />
            <button
              onClick={downloadVehicleExcel}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded shadow"
            >
              Download Vehicle Excel
            </button>
          </div>

          {displayData.length > 0 ? (
            <div
              className="overflow-x-auto mt-6 max-h-[600px] border border-gray-300"
              ref={listRef}
              onScroll={handleScroll}
            >
              <table className="w-full border-collapse text-sm md:text-base">
                <thead>
                  <tr className="bg-blue-600 text-white sticky top-0">
                    {[
                      "Trip ID",
                      "Entry Date",
                      "Vehicle No",
                      "Total Invoices",
                      "Transporter",
                      "Vehicle Type",
                      "Standard Weight",
                      "User Dock In",
                      "User Dock Out",
                    ].map((h) => (
                      <th key={h} className="p-3 md:p-4 border">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                      <td className="p-3 md:p-4 border">{item["Trip ID"]}</td>
                      <td className="p-3 md:p-4 border">{item["Pravesh Entry Date"]}</td>
                      <td className="p-3 md:p-4 border">{item["Vehicle No"]}</td>
                      <td className="p-3 md:p-4 border">{item["Total Invoices"]}</td>
                      <td className="p-3 md:p-4 border">{item["Transporter"]}</td>
                      <td className="p-3 md:p-4 border">{item["Vehicle Type"]}</td>
                      <td className="p-3 md:p-4 border">{item["Standard Weight"]}</td>
                      <td className="p-3 md:p-4 border">{item["User-Dock-In"]?.join(", ")}</td>
                      <td className="p-3 md:p-4 border">{item["User-Dock-Out"]?.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center font-semibold mt-6 text-gray-600">
              No vehicles match your search.
            </p>
          )}
        </>
      )}
    </div>
    </>
  );
}
