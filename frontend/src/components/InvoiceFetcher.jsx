import React, { useState } from "react";

const InvoiceFetcher = () => {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true);
    setError("");
    setInvoice(null);

    try {
      const res = await fetch("http://localhost:4000/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceNumber }),
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const found = data.invoices.nodes.find(
        (i) => i.invoiceNumber === invoiceNumber
      );

      if (!found) {
        setError("Invoice not found.");
      } else {
        setInvoice(found);
        console.log(data.invoices.nodes);
      }
    } catch (err) {
      setError("An error occurred while fetching the invoice.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-3xl font-bold mb-4">Fetch Invoice</h2>

      <input
        type="text"
        placeholder="Enter invoice number"
        value={invoiceNumber}
        onChange={(e) => setInvoiceNumber(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && fetchInvoice()}
        className="border p-2 w-full mb-2"
      />

      <button
        onClick={fetchInvoice}
        disabled={!invoiceNumber || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Loading..." : "Fetch Invoice"}
      </button>

      {error && <p className="text-red-500 mt-3">{error}</p>}
    </div>
  );
};

export default InvoiceFetcher;
