import { useEffect, useMemo, useState } from "react";
import Navbar2 from "../Navbar2";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { setNextCaseNumber } from "../../app/Slices/packingSlice";
import API from "../../api";
import { resetChoice } from "../../app/Slices/choiceSlice";
import Cookies from "js-cookie";
const initialForm = {
  part_no: "",
  description: "",
  hsn_no: "",
  gst: "",
  brand_name: "",
  total_packing_qty: "",
  mrp_invoice: "",
  mrp_box: "",
  total_mrp: "",
  npr: "",
  nsr: "",
  packed_in_plastic_bag: "",
  case_no_start: "",
  case_no_end: "",
  total_case: "",
  net_wt: "",
  gross_wt: "",
  total_net_wt: "",
  total_gross_wt: "",
  length: "",
  width: "",
  height: "",
  cbm: "",
};
function Separate() {
  const selectedClient = useSelector((state) => state.client.selectedClient);
  const client_name = selectedClient?.client_name || "";
  const marka = selectedClient?.marka || "";

  const nextCaseNumber = useSelector((state) => state.packing.nextCaseNumber);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const passedData = useMemo(() => location.state || {}, [location.state]);
  const [form, setForm] = useState(initialForm);
  const [packing, setPacking] = useState(null);
  const [stock, setStock] = useState(null);
  const [estimateList, setEstimateList] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [netWt, setNetWt] = useState([]);
  const notShow = ["total_mrp", "nsr", "npr"];
  const initialCase = nextCaseNumber;
  const disable = [
    "part_no",
    "description",
    "hsn_no",
    "gst",
    "brand_name",
    "mrp_invoice",
    "mrp_box",
    "case_no_end",
    "total_case",
    "total_net_wt",
    "total_gross_wt",
    "cbm",
  ];

  useEffect(() => {
    setForm((prev) => ({ ...prev, case_no_start: initialCase.toString() }));
  }, []);

  useEffect(() => {
    if (passedData.part_no && Array.isArray(estimateList)) {
      const matchedItem = estimateList.find(
        (item) => item.part_no === passedData.part_no
      );
      if (matchedItem) {
        setForm((prev) => ({
          ...prev,
          part_no: matchedItem.part_no,
          description: matchedItem.description || "",
          hsn_no: matchedItem.hsn || "",
          gst: matchedItem.tax_percent?.toString() || "",
          mrp_invoice: matchedItem.mrp?.toString() || "",
          mrp_box: matchedItem.mrp?.toString() || "",
        }));
      }
    }
  }, [passedData, estimateList]);

  useEffect(() => {
    if (passedData.part_no && Array.isArray(stock)) {
      const matchedItem = stock.find(
        (item) => item.part_no === passedData.part_no
      );
      if (matchedItem) {
        setForm((prev) => ({
          ...prev,
          brand_name: matchedItem.brand_name?.toString() || "",
        }));
      }
    }
  }, [passedData, stock]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [packingRes, stockRes, estimateRes] = await Promise.all([
          API.get(api/packing/packing/?client_name=Gaurav%20Kumar&marka=gkd),
          API.get("/api/packing/stock/"),
          API.get(/api/asstimate/?client_name=${client_name}&marka=${marka}),
        ]);
        setPacking(packingRes.data);
        setStock(stockRes.data);
        setEstimateList(estimateRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    if (client_name && marka) fetchAll();
  }, [client_name, marka]);

  useEffect(() => {
    if (!form.part_no || !stock || !packing) return;

    const stockMatch = stock.find((item) => item.part_no === form.part_no);
    const packingMatch = packing.find((item) => item.part_no === form.part_no);

    const stockQty = stockMatch?.qty || 0;
    const packingQty = packingMatch?.qty || 0;

    const minQty = Math.min(stockQty, packingQty);
    setForm((prev) => ({ ...prev, total_packing_qty: minQty.toString() }));
  }, [form.part_no, stock, packing]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("api/packing/net-weight/", {
          params: { part_no: form.part_no },
        });
        setNetWt(res.data)
      } catch (err) {
        alert(err.response?.data?.error || "Error fetching data");
      }
    };
    if (form.part_no) {
      fetchData();
    }
  }, [form.part_no]);

  useEffect(() => {
    const qty = parseInt(form.total_packing_qty, 10);
    const perBox = parseInt(form.packed_in_plastic_bag, 10);
    if (!isNaN(qty) && !isNaN(perBox) && perBox !== 0) {
      const totalBox = Math.ceil(qty / perBox);
      setForm((prev) => ({ ...prev, total_case: totalBox.toString() }));
    } else {
      setForm((prev) => ({ ...prev, total_case: "" }));
    }
  }, [form.total_packing_qty, form.packed_in_plastic_bag]);

  useEffect(() => {
    const start = parseInt(form.case_no_start, 10);
    const total = parseInt(form.total_case, 10);
    if (!isNaN(start) && !isNaN(total)) {
      const end = start + total - 1;
      setForm((prev) => ({ ...prev, case_no_end: end.toString() }));
      dispatch(setNextCaseNumber(end + 1));
    } else {
      setForm((prev) => ({ ...prev, case_no_end: "" }));
    }
  }, [form.case_no_start, form.total_case, dispatch]);
  useEffect(() => {
    const net_wt = parseFloat(form.net_wt);
    const total = parseInt(form.total_packing_qty, 10);
    if (!isNaN(net_wt) && !isNaN(total)) {
      const total_net_wt = (net_wt * total).toFixed(2);
      setForm((prev) => ({ ...prev, total_net_wt: total_net_wt.toString() }));
    } else {
      setForm((prev) => ({ ...prev, total_net_wt: "" }));
    }
  }, [form.net_wt, form.total_packing_qty]);
  useEffect(() => {
    const mrp = parseFloat(form.mrp_invoice);
    const qty = parseInt(form.total_packing_qty, 10);
    if (!isNaN(mrp) && !isNaN(qty)) {
      const total_mrp = (mrp * qty).toFixed(2);
      setForm((prev) => ({ ...prev, total_mrp: total_mrp.toString() }));
    } else {
      setForm((prev) => ({ ...prev, total_mrp: "" }));
    }
  }, [form.mrp_invoice, form.total_packing_qty]);

  useEffect(() => {
    const gross_wt = parseFloat(form.gross_wt);
    const total = parseInt(form.total_case, 10);
    if (!isNaN(gross_wt) && !isNaN(total)) {
      const total_gross_wt = (gross_wt * total).toFixed(2);
      setForm((prev) => ({
        ...prev,
        total_gross_wt: total_gross_wt.toString(),
      }));
    } else {
      setForm((prev) => ({ ...prev, total_gross_wt: "" }));
    }
  }, [form.gross_wt, form.total_case]);
  useEffect(() => {
    const length = parseFloat(form.length);
    const width = parseFloat(form.width);
    const height = parseFloat(form.height);
    const totalBox = parseInt(form.total_case, 10);
    if (!isNaN(length) && !isNaN(width) && !isNaN(height) && !isNaN(totalBox)) {
      const cbm = (length * width * height * totalBox * 0.00001638).toFixed(4);
      setForm((prev) => ({ ...prev, cbm: cbm.toString() }));
    } else {
      setForm((prev) => ({ ...prev, cbm: "" }));
    }
  }, [form.length, form.width, form.height, form.total_case]);

  const getCsrfToken = async () => {
    try {
      await API.get("/api/asstimate/set-csrf-cookie/", {
        withCredentials: true,
      });
    } catch (error) {
      console.error("Error setting CSRF cookie:", error);
    }
  };

  const handleNetwt = async () => {
    try {
      await getCsrfToken();
      const token = Cookies.get("csrftoken");
      const res = await API.post(
        "api/packing/net-weight/",
        {
          part_no: form.part_no,
          net_wt: parseFloat(form.net_wt),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": token,
          },
          withCredentials: true,
        }
      );
      console.log(res);
    } catch (err) {
      alert(err.response?.data?.error || "Error posting data");
    }
  };
  const preparePayload = () => {
    const nullableFields = Object.keys(initialForm).filter(
      (k) => k !== "part_no"
    );
    const payload = {
      client: client_name,
      marka,
      part_no: form.part_no,
    };

    for (const key of nullableFields) {
      const val = form[key];
      if (val === "") {
        payload[key] = null;
      } else if (
        [
          "gst",
          "mrp_invoice",
          "mrp_box",
          "total_mrp",
          "npr",
          "nsr",
          "net_wt",
          "gross_wt",
          "total_net_wt",
          "total_gross_wt",
          "length",
          "width",
          "height",
          "cbm",
        ].includes(key)
      ) {
        payload[key] = parseFloat(val);
      } else if (
        [
          "total_packing_qty",
          "packed_in_plastic_bag",
          "case_no_start",
          "case_no_end",
          "total_case",
        ].includes(key)
      ) {
        payload[key] = parseInt(val, 10);
      } else {
        payload[key] = val;
      }
    }

    return payload;
  };
  const handleSelectChangeNetwt=(e)=>{
    const value = e.target.value;
    setSelectedOption(value);

    if (value !== "Other") {
      setForm((prev) => ({ ...prev, net_wt: value.toString() }));
    } 
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };
  const handleCustomInputChange = (e) => {
  const value = e.target.value;
  setCustomInput(value);
  setForm((prev) => ({ ...prev, net_wt: value }));
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    const totalGrossWt = parseFloat(form.total_gross_wt);
    const totalNetWt = parseFloat(form.total_net_wt);
    const totalqty = parseFloat(form.total_packing_qty);
    const boxqty = parseFloat(form.packed_in_plastic_bag);
    const totalbox = parseFloat(form.total_case);
    const remainder = totalqty % boxqty;
    const adjustedQty = totalqty - remainder;

    if (!form.part_no) {
      alert("Part number is required.");
      return;
    }

    if (
      !isNaN(totalGrossWt) &&
      !isNaN(totalNetWt) &&
      totalGrossWt < totalNetWt
    ) {
      alert("Total Gross Weight cannot be less than Total Net Weight.");
      return;
    }
    if (!isNaN(totalqty) && !isNaN(boxqty) && totalqty / boxqty !== totalbox) {
      if (
        remainder !== 0 &&
        window.confirm(
          The last packet contains only ${remainder} units instead of the full ${boxqty}.\n\n +
            Do you want to automatically update the total quantity to ${adjustedQty}?
        )
      ) {
        setForm((prevForm) => ({
          ...prevForm,
          total_packing_qty: adjustedQty,
        }));
      }
      return;
    }

    try {
      if (passedData.part_no) {
        await API.post("/api/packing/packing/delete-by-partno/", {
          part_no: form.part_no,
          qty: parseInt(form.total_packing_qty, 10) || 0,
          client: client_name,
          marka: marka,
        });
        alert("Packing updated (quantity reduced or deleted)");
      }

      const payload = preparePayload();
      await API.post("/api/packing/packing-details/", payload);
      handleNetwt();
      alert("Packing detail added.");
      setForm(initialForm);
      dispatch(resetChoice());
      navigate("/row-packing-list");
    } catch (error) {
      console.error(error);
      alert("Error submitting form.");
    }
  };
  return (
    <div>
      <Navbar2 />
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Add Product</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {Object.entries(form).map(([key, value]) => {
            if (notShow.includes(key)) return null;

            return key === "net_wt" ? (
              <div key={key}>
                 <div className="p-4">
      <label className="block mb-2 font-semibold">Net Wiegth</label>
      <select
        value={selectedOption}
        onChange={handleSelectChangeNetwt}
        className="border px-2 py-1"
      >
        <option value="">-- Select --</option>
        {netWt.map((opt, index) => (
          <option key={index} value={opt.net_wt}>
            {${opt.net_wt}     ---   ${opt.count}}
          </option>
        ))}
        <option value="Other">New Net Wiegth</option>
      </select>

       {selectedOption === "Other" && (
        <div className="mt-2">
          <input
            name="net wt"
            type="text"
            placeholder="Enter custom option"
            value={customInput}
            onChange={handleCustomInputChange}
            className="border px-2 py-1"
          />
        </div>
      )}
    </div>
              </div>
            ) : (
                <div key={key}>
                  <label
                    htmlFor={key}
                    className="block text-sm font-medium text-gray-700 mb-1 capitalize"
                  >
                    {key.replace(/_/g, " ")}
                  </label>
                  <input
                    id={key}
                    type="text"
                    name={key}
                    value={value}
                    onChange={handleChange}
                    disabled={disable.includes(key)}
                    placeholder={Enter ${key.replace(/_/g, " ")}}
                    className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      disable.includes(key)
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}
                  />
                </div>
              );
          })}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
export default Separate;