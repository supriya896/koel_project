import React from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { FaTrash } from "react-icons/fa";

const Dummy = () => {
  const [vehicleTypes, setVehicleTypes] = React.useState([]);
  const [details, setDetails] = React.useState([]);
  const [newVehicleType, setNewVehicleType] = React.useState("");
  const BASE_URL = "https://koelpravesh.kirloskar.com:5300";

  const statusOptions = ["Green Channel", "Normal"];
  const unloadOptions = ["RM Unload", "CAPEX Unload", "Other"];
  const categoryOptions = [
    "Raw Material & Indirect Material",
    "Oil, Petrol, Diesel, Chemicals",
    "Finished Goods",
    "Gas All-LPG,Co2,O2",
    "Hazardous Waste",
    "Scrap Material",
    "Spare Parts",
    "Skid/Bin/Pallet Dispatch",
    "Inter Plant/Supplier Dispatch",
    "Other",
  ];

  const handleChange = (id, field, value) => {
    setVehicleTypes((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const getExistingDetail = (vehicleTypeId, status, unload, category) =>
    details.find(
      (d) =>
        d.vehicle_type_master_id === vehicleTypeId &&
        d.status === status &&
        d.unload === unload &&
        d.category === category
    );

  const handleDropDown = (v) => {
    const existing = getExistingDetail(v.id, v.status, v.unload, v.category);
    setVehicleTypes((prev) =>
      prev.map((x) =>
        x.id === v.id
          ? existing
            ? {
                ...x,
                standard_time_minutes: existing.standard_time_minutes,
                standard_weight_kgs: existing.standard_weight_kgs,
              }
            : { ...x, standard_time_minutes: "", standard_weight_kgs: "" }
          : x
      )
    );
  };

  const handleSave = async (v) => {
    if (
      !v.status ||
      !v.unload ||
      !v.category ||
      v.standard_time_minutes <= 0 ||
      v.standard_weight_kgs <= 0
    ) {
      //   alert("Please select all dropdowns and enter all the details");
      toast.warn("Please select all dropdowns and enter all the details", {
        style: {
          backgroundColor: "#ffcc00",
          color: "#333",
          fontWeight: "bold",
        },
      });
      return;
    }

    try {
      const existing = getExistingDetail(v.id, v.status, v.unload, v.category);
      const confirmSave = window.confirm(
        existing
          ? "Are you sure you want to update the existing details?"
          : "Are you sure you want to save the new details?"
      );
      if (!confirmSave) {
        return;
      }
      const payload = {
        vehicle_type_id: v.id,
        status: v.status,
        unload: v.unload,
        category: v.category,
        standard_time_minutes: v.standard_time_minutes,
        standard_weight_kgs: v.standard_weight_kgs,
        created_by: "admin",
      };

      await axios.post(`${BASE_URL}/save_vehicle_type_details`, payload);
      //   alert(existing ? "Updated successfully" : "Saved successfully");
      toast.success(existing ? "Updated successfully" : "Saved successfully", {
        style: {
          backgroundColor: "#19967d",
          color: "white",
          fontWeight: "bold",
        },
      });
      fetchDetails();
    } catch (error) {
      console.error("Error saving data:", error);
      //   alert(error.response?.data?.message || "Error saving data");
      toast.error(error.response?.data?.message || "Error saving data", {
        style: {
          backgroundColor: "#e74c3c",
          color: "white",
          fontWeight: "bold",
        },
      });
    }
  };

  const handleAddNewVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicleType.trim()) {
      //   alert("Vehicle type cannot be empty");
      toast.warn("Vehicle type cannot be empty", {
        style: { backgroundColor: "#ffcc00", color: "#333" },
      });
      return;
    }

    const exists = vehicleTypes.some(
      (v) => v.vehicle_type.toLowerCase() === newVehicleType.toLowerCase()
    );
    if (exists) {
      //   alert("Vehicle type already exists");
      toast.warn("Vehicle type already exists", {
        style: { backgroundColor: "#ffcc00", color: "#333" },
      });

      return;
    }

    try {
      await axios.post(`${BASE_URL}/create_vehicle_type`, {
        vehicle_type: newVehicleType.trim(),
        plant_location: "KAGAL",
        created_by: "admin",
      });
      //   alert("Vehicle type added successfully");
      toast.success("Vehicle type added successfully", {
        style: {
          backgroundColor: "#19967d",
          color: "white",
          fontWeight: "bold",
        },
      });
      setNewVehicleType("");
      fetchVehicleTypes();
    } catch (error) {
      console.error("Error adding vehicle type:", error);
      //   alert(error.response?.data?.message || "Error adding vehicle type");
      toast.error(
        error.response?.data?.message || "Error adding vehicle type",
        {
          style: {
            backgroundColor: "#e74c3c",
            color: "white",
            fontWeight: "bold",
          },
        }
      );
    }
  };

  const handleDelete = async (v, detail = null) => {
    // Ask for user confirmation

    const hasDetail =
      detail &&
      detail.status &&
      detail.unload &&
      detail.category &&
      detail.status.trim() !== "" &&
      detail.unload.trim() !== "" &&
      detail.category.trim() !== "";

    const confirmed = window.confirm(
      `Are you sure you want to delete ${
        hasDetail ? "this detail" : "this vehicle type"
      }?`
    );
    if (!confirmed) return;

    try {
      // Construct URL with optional query params if deleting a specific detail
      let url = `${BASE_URL}/vehicle_type/${v.id}`;
      if (detail && detail.status && detail.unload && detail.category) {
        url += `?status=${encodeURIComponent(
          detail.status
        )}&unload=${encodeURIComponent(
          detail.unload
        )}&category=${encodeURIComponent(detail.category)}`;
      }

      const response = await axios.delete(url);

      toast.success(response.data.message, {
        style: {
          backgroundColor: "#19967d",
          color: "white",
          fontWeight: "bold",
        },
      });

      // Refresh both master and details
      fetchVehicleTypes();
      fetchDetails();
    } catch (error) {
      console.error(
        "Error deleting vehicle type:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message || "Error deleting vehicle type",
        {
          style: {
            backgroundColor: "#e74c3c",
            color: "white",
            fontWeight: "bold",
          },
        }
      );
    }
  };

  React.useEffect(() => {
    fetchVehicleTypes();
    fetchDetails();
  }, []);

  const fetchVehicleTypes = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/get_vehicle_types`);
      setVehicleTypes(response.data.data);
    } catch (error) {
      console.log(error.response);
    }
  };

  const fetchDetails = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/get_vehicle_type_details`);
      setDetails(response.data.data);
    } catch (error) {
      console.log(error.response);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white py-12 px-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto bg-white shadow-2xl rounded-3xl p-10 border border-emerald-100">
        <h2 className="text-4xl font-extrabold text-emerald-700 text-center mb-8 tracking-wide">
          Vehicle Type Master
        </h2>

        {/* Add New Vehicle Form */}
        <form
          onSubmit={handleAddNewVehicle}
          className="flex flex-wrap justify-center items-center gap-5 mb-12"
        >
          <input
            type="text"
            value={newVehicleType}
            onChange={(e) => setNewVehicleType(e.target.value)}
            placeholder="Enter new vehicle type"
            className="border-2 border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-2xl px-5 py-3 w-72 shadow-md transition-all duration-200"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold px-8 py-3 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
          >
            + Add Vehicle
          </button>
        </form>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-emerald-200 shadow-xl">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gradient-to-r from-emerald-700 to-green-600 text-white">
              <tr>
                {[
                  "Plant Location",
                  "Vehicle Type",
                  "Status",
                  "Unload",
                  "Category",
                  "Standard Time (min)",
                  "Standard Weight (kg)",
                  "Action",
                  "Delete",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-4 px-5 font-semibold text-center border-b border-emerald-300"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicleTypes.map((type, index) => (
                <tr
                  key={type.id}
                  className={`text-center transition-all ${
                    index % 2 === 0 ? "bg-white" : "bg-emerald-50"
                  } hover:bg-emerald-100`}
                >
                  <td className="p-4 border">{type.plant_location}</td>
                  <td className="p-4 border font-medium text-emerald-800">
                    {type.vehicle_type}
                  </td>

                  {/* Status */}
                  <td className="p-4 border">
                    <select
                      value={type.status || ""}
                      onChange={(e) => {
                        handleChange(type.id, "status", e.target.value);
                        handleDropDown({ ...type, status: e.target.value });
                      }}
                      className="border border-emerald-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm w-full"
                    >
                      <option value="">Select</option>
                      {statusOptions.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>

                  {/* Unload */}
                  <td className="p-4 border">
                    <select
                      value={type.unload || ""}
                      onChange={(e) => {
                        handleChange(type.id, "unload", e.target.value);
                        handleDropDown({ ...type, unload: e.target.value });
                      }}
                      className="border border-emerald-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm w-full"
                    >
                      <option value="">Select</option>
                      {unloadOptions.map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </td>

                  {/* Category */}
                  <td className="p-4 border">
                    <select
                      value={type.category || ""}
                      onChange={(e) => {
                        handleChange(type.id, "category", e.target.value);
                        handleDropDown({ ...type, category: e.target.value });
                      }}
                      className="border border-emerald-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm w-full"
                    >
                      <option value="">Select</option>
                      {categoryOptions.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </td>

                  {/* Time */}
                  <td className="p-4 border">
                    <input
                      type="number"
                      value={type.standard_time_minutes || ""}
                      onChange={(e) =>
                        handleChange(
                          type.id,
                          "standard_time_minutes",
                          e.target.value
                        )
                      }
                      className="border border-emerald-300 rounded-xl px-3 py-2 w-28 text-center focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    />
                  </td>

                  {/* Weight */}
                  <td className="p-4 border">
                    <input
                      type="number"
                      value={type.standard_weight_kgs || ""}
                      onChange={(e) =>
                        handleChange(
                          type.id,
                          "standard_weight_kgs",
                          e.target.value
                        )
                      }
                      className="border border-emerald-300 rounded-xl px-3 py-2 w-28 text-center focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    />
                  </td>

                  {/* Action */}
                  <td className="p-4 border">
                    <button
                      onClick={() => handleSave(type)}
                      className={`${
                        getExistingDetail(
                          type.id,
                          type.status,
                          type.unload,
                          type.category
                        )
                          ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                          : "bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500"
                      } text-white px-5 py-2 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 font-semibold`}
                    >
                      {getExistingDetail(
                        type.id,
                        type.status,
                        type.unload,
                        type.category
                      )
                        ? "Update"
                        : "Save"}
                    </button>
                  </td>

                  <td className="p-4 border text-center">
                    <button
                      onClick={() =>
                        handleDelete(type, {
                          status: type.status,
                          unload: type.unload,
                          category: type.category,
                        })
                      }
                      className="bg-gradient-to-r from-rose-400 to-red-500 hover:from-rose-500 hover:to-red-600
               text-white px-5 py-2 rounded-2xl shadow-md hover:shadow-lg
               transform hover:-translate-y-1 transition-all duration-300 font-semibold
               flex items-center gap-2 justify-center"
                      title="Delete"
                    >
                      <FaTrash size={18} className="text-white" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dummy;
