import React, { useEffect, useState, useRef, useContext } from "react";
import { LatestInvoiceContext } from "../helpers/LatestInvoiceContext";
import { storeData, loadData } from "../helpers/localData";
import { useTheme } from "../helpers/ThemeContext";

const apiUrl = import.meta.env.VITE_API_URL;

const fetchInvoicesLog = async () => {
  try {
    const req = await fetch(`${apiUrl}/api/logs/invoices`);
    const res = await req.json();
    return res;
  } catch (err) {
    console.error("Failed to fetch log:", err);
    return null;
  }
};

const fetchInvoiceById = async (itemId) => {
  try {
    const res = await fetch(`${apiUrl}/invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ itemId }),
    });

    if (!res.ok) throw new Error("Failed to fetch invoice");

    const invoiceData = await res.json();
    return invoiceData.invoice;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const History = () => {
  const [logs, setLogs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const { latestInvoice } = useContext(LatestInvoiceContext);
  const socketRef = useRef(null);
  const { theme } = useTheme();
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);

  const handleClick = (invoice, event) => {
    if (event.altKey) {
      setSelectedInvoices((prev) =>
        prev.includes(invoice.id)
          ? prev.filter((id) => id !== invoice.id)
          : [...prev, invoice.id]
      );
      return;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({ type: "INVOICE_SELECTED", data: invoice })
      );

      // Update selected invoice state
      setInvoices((prev) =>
        prev.map((inv) => ({
          ...inv,
          isSelected: inv.id === invoice.id,
        }))
      );
    } else {
      console.warn("WebSocket not connected");
    }
  };

  const loadLogs = async () => {
    const raw = await fetchInvoicesLog();
    const sorted = raw.sort(
      (a, b) => new Date(b.occurredAt) - new Date(a.occurredAt)
    );
    setLogs(sorted);
  };

  const fetchPage = async () => {
    const sentInvoices = loadData("sentInvoices");
    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    const nextLogs = logs.slice(start, end);

    const fetched = await Promise.all(
      nextLogs.map((entry) =>
        fetchInvoiceById(entry.itemId).then((invoice) => {
          if (!invoice) return null;
          return {
            ...invoice,
            isSelected: invoice.id === latestInvoice?.id,
            isSent:
              Array.isArray(sentInvoices) && sentInvoices.includes(invoice.id),
          };
        })
      )
    );

    setInvoices(fetched.filter(Boolean));
  };

  const sendInvoices = async () => {
    for (let i = 0; i < selectedInvoices.length; ++i) {
      const currentInvoice = await fetchInvoiceById(selectedInvoices[i]);

      if (localStorage.getItem("sentInvoices")?.includes(currentInvoice.id)) {
        const userConfirmed = window.confirm(
          "L'une des factures a déjà été envoyée. Voulez-vous l'envoyer à nouveau ?"
        );
        if (!userConfirmed) {
          return;
        }
      }

      setIsLoading(true);

      try {
        const res = await fetch(`${apiUrl}/winbiz`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(currentInvoice),
        });

        const data = await res.json();

        if (
          socketRef.current &&
          socketRef.current.readyState === WebSocket.OPEN
        ) {
          socketRef.current.send(
            JSON.stringify({ type: "INVOICE_SENT", data: currentInvoice })
          );
        } else {
          console.warn("WebSocket not connected");
        }

        console.log("✅ Winbiz API response:", data);
      } catch (e) {
        console.error("❌ Failed to fetch Winbiz data:", e);
      } finally {
        storeData("sentInvoices", currentInvoice.id);
      }
    }

    setIsLoading(false);
    setSelectedInvoices([]);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (logs.length > 0) {
      fetchPage();
    }
  }, [page, logs, latestInvoice]);

  useEffect(() => {
    let retryTimeout;

    const connectWebSocket = () => {
      const socket = new WebSocket("ws://localhost:4000");
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("✅ WebSocket 2 connected");
      };

      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "INVOICE_SENT") {
          fetchInvoiceById(msg.data.id).then((invoice) => {
            if (!invoice) return;

            // Update sent invoice state
            setInvoices((prev) =>
              prev.map((inv) =>
                inv.id === invoice.id ? { ...inv, isSent: true } : inv
              )
            );
            invoice.isSent = true;
          });
        } else if (msg.type === "INVOICE_CREATED") {
          console.log("📬 Nouvel invoice reçu !");
          loadLogs();
          fetchPage();
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      socket.onclose = () => {
        console.warn("⚠️ WebSocket closed. Retrying in 2s...");
        retryTimeout = setTimeout(connectWebSocket, 2000);
      };
    };

    setTimeout(connectWebSocket, 500);

    return () => {
      if (socketRef.current) socketRef.current.close();
      clearTimeout(retryTimeout);
    };
  }, []);

  return (
    <div
      id="history"
      className={`flex flex-col w-[25vw] backdrop-blur border shadow-lg p-4 rounded-lg transition ${
        theme === "dark"
          ? "bg-black/30 border-black/40 text-offwhite"
          : "bg-offwhite/30 border-white/40 text-black"
      }`}
    >
      <h2
        className={`text-3xl font-semibold mb-5 ${
          theme === "dark" ? "text-pink" : "text-black"
        }`}
      >
        📜 Historique
      </h2>
      <div className="space-y-2 overflow-y-auto max-h-[70vh] text-sm">
        {invoices.length === 0 ? (
          <p className="text-gray-500">Aucun log disponible.</p>
        ) : (
          <>
            {invoices.map((entry, i) => (
              <div
                key={i}
                onClick={(event) => handleClick(entry, event)}
                className={`flex justify-between items-center p-2 border rounded-lg backdrop-blur border border-white/40 cursor-pointer ${
                  entry.isSent
                    ? entry.isSelected
                      ? "bg-blue-500/80"
                      : "bg-blue-500/50 hover:bg-blue-500/80"
                    : entry.isSelected
                    ? "bg-pink"
                    : "bg-pink/30 hover:bg-pink/80"
                }`}
              >
                <div className="space-y-2">
                  {`#${entry?.invoiceNumber}` || "N/A"}
                  {" | "}
                  {entry?.client?.isCompany
                    ? entry?.client?.companyName
                    : `${entry?.client?.firstName || "N/A"} ${
                        entry?.client?.lastName || "N/A"
                      }`}
                </div>
                <div
                  className={`${
                    selectedInvoices.includes(entry.id) ? "block" : "hidden"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                  >
                    <g>
                      <path
                        d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
                        stroke="white"
                        fill="#2b7fff"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                      <path
                        opacity="1"
                        d="M7.75 11.9999L10.58 14.8299L16.25 9.16992"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </g>
                  </svg>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center mt-4">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className={`bg-black/50 px-3 py-1 rounded disabled:opacity-50 disabled:pointer-events-none cursor-pointer transition ${
                  theme === "dark"
                    ? "bg-black/50 border-black/40 hover:bg-black/100"
                    : "bg-offwhite/50 border-white/40 hover:bg-white/100"
                }`}
              >
                ⬅️ Précédent
              </button>

              <span>
                Page {page + 1} / {totalPages}
              </span>

              <button
                disabled={(page + 1) * ITEMS_PER_PAGE >= logs.length}
                onClick={() => setPage((p) => p + 1)}
                className={`bg-black/50 px-3 py-1 rounded disabled:opacity-50 disabled:pointer-events-none cursor-pointer transition ${
                  theme === "dark"
                    ? "bg-black/50 border-black/40 hover:bg-black/100"
                    : "bg-offwhite/50 border-white/40 hover:bg-white/100"
                }`}
              >
                Suivant ➡️
              </button>
            </div>

            <div
              className={`items-center gap-2 w-full mt-5 text-white ${
                selectedInvoices.length ? "flex" : "hidden"
              }`}
            >
              <button
                className={`w-1/2 cursor-pointer px-3 py-1 rounded hover:bg-red-500 border transition ${
                  theme === "dark"
                    ? "bg-red-500/70 border-red-500/70"
                    : "bg-red-500/50 border-white"
                }`}
                onClick={() => setSelectedInvoices([])}
              >
                Tout désélectionner
              </button>
              <button
                className={`w-1/2 cursor-pointer px-3 py-1 rounded hover:bg-blue-500 border transition ${
                  theme === "dark"
                    ? "bg-blue-500/70 border-blue-500/70"
                    : "bg-blue-500/50 border-white"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => sendInvoices()}
                disabled={isLoading}
              >
                {isLoading
                  ? `Envoi de ${selectedInvoices.length} éléments en cours...`
                  : `Tout envoyer (${selectedInvoices.length})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default History;
