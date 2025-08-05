import React, { useEffect, useState, useContext, useRef } from "react";
import { LatestInvoiceContext } from "../helpers/LatestInvoiceContext";
import { storeData, loadData, deleteData } from "../helpers/localData";
import { useTheme } from "../helpers/ThemeContext";

const apiUrl = import.meta.env.VITE_API_URL;
const dateOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

const SectionTitle = ({ name }) => {
  return (
    <>
      <h3 className="font-bold text-2xl mb-3 col-span-2">{name}</h3>
    </>
  );
};

const SectionItem = ({ name, data, width = "w-[150px]" }) => {
  return (
    <div className="flex">
      <span className={`font-bold ${width} pr-2`}>{name}:</span>
      {Array.isArray(data) ? (
        <div>
          {data.map((item, idx) => (
            <React.Fragment key={idx}>
              <p key={idx}>{item}</p>
            </React.Fragment>
          ))}
        </div>
      ) : (
        <span>{data}</span>
      )}
    </div>
  );
};

const TableLineItem = ({ number }) => {
  const { latestInvoice } = useContext(LatestInvoiceContext);

  const TableRow = ({ name, data }) => {
    return (
      <tr className="border">
        <td className="font-medium px-2 bg-white/20">{name}</td>
        <td className="border-l px-2 bg-white/30">{data}</td>
      </tr>
    );
  };

  return (
    <>
      <span className="font-bold">Job #{number + 1}:</span>
      <table className="border border-collapse mb-5">
        <tbody>
          <TableRow
            name="Nom"
            data={latestInvoice?.lineItems?.nodes[number]?.name || "N/A"}
          />
          <TableRow
            name="Description"
            data={latestInvoice?.lineItems?.nodes[number]?.description || "N/A"}
          />
          <TableRow
            name="Date"
            data={
              new Date(latestInvoice?.lineItems?.nodes[number]?.date)
                .toLocaleDateString("fr-FR", dateOptions)
                .replace(/^\p{Letter}/u, (c) => c.toUpperCase()) || "N/A"
            }
          />
          <TableRow
            name="Prix unitaire"
            data={
              `CHF ${latestInvoice?.lineItems?.nodes[number]?.unitPrice}` ||
              "N/A"
            }
          />
          <TableRow
            name="Quantité"
            data={latestInvoice?.lineItems?.nodes[number]?.quantity || "N/A"}
          />
          <TableRow
            name="Prix total"
            data={
              `CHF ${latestInvoice?.lineItems?.nodes[number]?.totalPrice}` ||
              "N/A"
            }
          />
        </tbody>
      </table>
    </>
  );
};

const Separator = () => {
  return <div className="col-span-2 border-b my-6" />;
};

const InvoiceWatcher = () => {
  const { latestInvoice, setLatestInvoice } = useContext(LatestInvoiceContext);
  const [invoiceTitle, setInvoiceTitle] = useState(
    "📬 Nouvelle facture reçue !"
  );
  const socketRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  // const [gender, setGender] = useState("M");
  const { theme } = useTheme();

  const fetchInvoiceById = async (itemId) => {
    try {
      const res = await fetch(`${apiUrl}/invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId }),
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const invoiceData = await res.json();
      const found = invoiceData.invoice.id === itemId;

      if (!found) {
        console.log("Invoice not found.");
      } else {
        setLatestInvoice(invoiceData.invoice);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendData = async () => {
    // const enrichedInvoice = {
    //   ...latestInvoice,
    //   client: {
    //     ...latestInvoice.client,
    //     gender: gender,
    //   },
    // };

    if (localStorage.getItem("sentInvoices")?.includes(latestInvoice.id)) {
      const userConfirmed = window.confirm(
        "Cette facture a déjà été envoyée. Voulez-vous l'envoyer à nouveau ?"
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
        body: JSON.stringify(latestInvoice),
      });

      const data = await res.json();

      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.send(
          JSON.stringify({ type: "INVOICE_SENT", data: latestInvoice })
        );
      } else {
        console.warn("WebSocket not connected");
      }

      console.log("✅ Winbiz API response:", data);
    } catch (e) {
      console.error("❌ Failed to fetch Winbiz data:", e);
    } finally {
      setIsLoading(false);
      deleteData("latestInvoice");
      storeData("sentInvoices", latestInvoice.id);
      setLatestInvoice(null);
    }
  };

  useEffect(() => {
    let socket;
    let retryTimeout;

    const connectWebSocket = () => {
      const socket = new WebSocket(
        import.meta.env.VITE_WS_URL || "ws://localhost:4000"
      );
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("✅ WebSocket connected");
        const latestInvoice = loadData("latestInvoice");
        if (latestInvoice) {
          fetchInvoiceById(latestInvoice.itemId);
        }
      };

      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (
          msg.type === "INVOICE_CREATED" ||
          msg.type === "INVOICE_UPDATED" ||
          msg.type === "INVOICE_SELECTED"
        ) {
          let id;
          switch (msg.type) {
            case "INVOICE_CREATED":
              setInvoiceTitle("📬 Nouvelle facture reçue !");
              storeData("latestInvoice", msg.data);
              id = msg.data.itemId;
              break;
            case "INVOICE_UPDATED":
              setInvoiceTitle("📬 Facture mise à jour !");
              storeData("latestInvoice", msg.data);
              id = msg.data.itemId;
              break;
            case "INVOICE_SELECTED":
              setInvoiceTitle("📬 Facture sélectionnée");
              storeData("latestInvoice", { itemId: msg.data.id });
              id = msg.data.id;
              break;
          }
          fetchInvoiceById(id);
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
      if (socket) socket.close();
      clearTimeout(retryTimeout);
    };
  }, []);

  if (!latestInvoice)
    return (
      <p className="text-white text-lg">En attente d'une nouvelle facture...</p>
    );

  return (
    <div
      id="invoice-watcher"
      className={`flex flex-col gap-y-3 p-4 max-w-[50vw] rounded-lg backdrop-blur border shadow-lg mb-10 transition ${
        theme === "dark"
          ? "bg-black/30 border-black/40 text-offwhite"
          : "bg-offwhite/30 border-white/40 text-black"
      }`}
    >
      <h2
        className={`text-3xl font-semibold ${
          theme === "dark" ? "text-pink" : "text-black"
        }`}
      >
        {invoiceTitle}
      </h2>
      <div className="space-y-2 p-4">
        {/* General infos */}
        <SectionTitle name="Informations générales" />
        <SectionItem name="ID" data={latestInvoice?.id || "N/A"} />
        <SectionItem
          name="N° facture"
          data={latestInvoice?.invoiceNumber || "N/A"}
        />
        <SectionItem name="Sujet" data={latestInvoice?.subject || "N/A"} />
        <SectionItem
          name="Date de paiement"
          data={
            latestInvoice.dueDate
              ? new Date(latestInvoice.dueDate)
                  .toLocaleDateString("fr-FR", dateOptions)
                  .replace(/^\p{Letter}/u, (c) => c.toUpperCase()) || "N/A"
              : "N/A"
          }
        />

        <Separator />

        {/* Client */}
        <SectionTitle name="Client" />
        {/* <SectionItem
          name="Civilité"
          data={
            <div className="flex gap-5">
              <div className="flex gap-2">
                <input
                  type="radio"
                  id="M"
                  name="gender"
                  value="M"
                  checked={gender === "M"}
                  onChange={(e) => setGender(e.target.value)}
                />
                <label htmlFor="M">Monsieur</label>
              </div>

              <div className="flex gap-2">
                <input
                  type="radio"
                  id="F"
                  name="gender"
                  value="F"
                  checked={gender === "F"}
                  onChange={(e) => setGender(e.target.value)}
                />
                <label htmlFor="F">Madame</label>
              </div>

              <div className="flex gap-2">
                <input
                  type="radio"
                  id="A"
                  name="gender"
                  value="A"
                  checked={gender === "A"}
                  onChange={(e) => setGender(e.target.value)}
                />
                <label htmlFor="A">Autre</label>
              </div>
            </div>
          }
        /> */}
        <SectionItem
          name="Prénom Nom"
          data={
            latestInvoice?.client?.isCompany
              ? latestInvoice?.client?.companyName
              : `${latestInvoice?.client?.firstName || "N/A"} ${
                  latestInvoice?.client?.lastName || "N/A"
                }`
          }
        />
        <SectionItem
          name="Téléphone"
          data={latestInvoice?.client?.phones[0]?.number || "N/A"}
        />
        <SectionItem
          name="Email"
          data={latestInvoice?.client?.emails[0]?.address || "N/A"}
        />
        <SectionItem
          name="Adresse de facturation"
          data={[
            latestInvoice?.billingAddress?.street || "N/A",
            `${latestInvoice?.billingAddress?.postalCode || "N/A"} ${
              latestInvoice?.billingAddress?.city || "N/A"
            }`,
            `${latestInvoice?.billingAddress?.province || "N/A"}, ${
              latestInvoice?.billingAddress?.country || "N/A"
            }`,
          ]}
        />

        <Separator />

        {/* Balance */}
        <SectionTitle name="Jobs" />
        {latestInvoice.lineItems.nodes.length > 1 ? (
          latestInvoice.lineItems.nodes.map((item, index) => (
            <TableLineItem key={index} number={index} />
          ))
        ) : (
          <TableLineItem number={0} />
        )}
        <SectionItem
          name="Total"
          data={`CHF ${latestInvoice?.amounts?.total}` || "N/A"}
          width="w-auto"
        />
      </div>

      {/* Confirm */}
      <button
        id="confirm-button"
        className={`bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer self-end hover:bg-blue-600 transition-colors ${
          isLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={sendData}
        disabled={isLoading}
      >
        {isLoading ? "Envoi en cours..." : "Confirmer et envoyer sur Winbiz"}
      </button>
    </div>
  );
};

export default InvoiceWatcher;
