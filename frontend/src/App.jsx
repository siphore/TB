import { useState, useEffect, useMemo } from "react";
import { LatestInvoiceContext } from "./helpers/LatestInvoiceContext";
import { ThemeProvider } from "./helpers/ThemeContext";
import Login from "./components/Login";
import Header from "./components/Header";
import Title from "./components/Title";
import History from "./components/History";
import InvoiceWatcher from "./components/InvoiceWatcher";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

function App() {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [authenticated, setAuthenticated] = useState(null); // null = loading
  const [latestInvoice, setLatestInvoice] = useState(null);
  const [isTourActive, setIsTourActive] = useState(false);

  // driverObj is defined using useMemo so it's stable across renders
  const driverObj = useMemo(
    () =>
      driver({
        showProgress: true,
        nextBtnText: "Suivant",
        prevBtnText: "Précédent",
        doneBtnText: "Terminer",
        onDestroyed: () => {
          setIsTourActive(false);
        },
        steps: [
          {
            popover: {
              title: "Bienvenue !",
              description:
                "Voici un rapide aperçu de l'outil. Suis les étapes pour comprendre comment envoyer une facture sur Winbiz.",
            },
          },
          {
            element: "#history",
            popover: {
              title: "Historique des factures",
              description:
                "Ici, tu peux voir toutes les factures récemment récupérées depuis Jobber et consulter leurs détails.",
              side: "right",
              align: "start",
            },
          },
          {
            element: "#invoice-watcher",
            popover: {
              title: "Prévisualisation de la facture",
              description:
                "Cette section affiche en direct le résumé de la facture avant de l'envoyer.",
              side: "left",
              align: "center",
            },
          },
          {
            element: "#confirm-button",
            popover: {
              title: "Envoyer vers Winbiz",
              description:
                "Clique ici pour valider et envoyer la facture générée directement dans Winbiz.",
              side: "top",
              align: "center",
            },
          },
          {
            popover: {
              title: "C'est terminé !",
              description:
                "Tu es prêt à utiliser l'outil. Tu peux maintenant envoyer tes factures sans soucis !",
            },
          },
        ],
      }),
    []
  );

  // Trigger guided tour on first visit
  useEffect(() => {
    if (localStorage.getItem("firstVisit") === "false") return;

    const timer = setTimeout(() => {
      localStorage.setItem("firstVisit", "false");
      setIsTourActive(true);
      driverObj.drive();
    }, 2000);

    return () => clearTimeout(timer);
  }, [driverObj]);

  // ✅ Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return setAuthenticated(false);

    fetch(`${apiUrl}/protected`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 200) return res.json();
        throw new Error("Not authenticated");
      })
      .then(() => setAuthenticated(true))
      .catch(() => {
        localStorage.removeItem("token");
        setAuthenticated(false);
      });
  }, [apiUrl]);

  // Show login if not authenticated
  if (authenticated === false)
    return <Login setAuthenticated={setAuthenticated} />;
  if (authenticated === null) return <div>Loading...</div>;

  return (
    <ThemeProvider>
      <LatestInvoiceContext.Provider
        value={{ latestInvoice, setLatestInvoice }}
      >
        <div className="flex flex-col items-center justify-center gap-10">
          <Header
            driverObj={driverObj}
            isTourActive={isTourActive}
            setIsTourActive={setIsTourActive}
          />
          <Title />
          <div className="flex items-start justify-center w-full gap-30">
            <History />
            <InvoiceWatcher />
          </div>
        </div>
      </LatestInvoiceContext.Provider>
    </ThemeProvider>
  );
}

export default App;
