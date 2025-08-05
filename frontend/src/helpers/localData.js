const storeData = (key, data) => {
  if (!data) return;

  switch (key) {
    case "sentInvoices":
      try {
        if (localStorage.getItem(key) === null) localStorage.setItem(key, "[]");

        if (!localStorage.getItem(key).includes(data)) {
          const arr = JSON.parse(localStorage.getItem(key)) || [];
          arr.push(data);
          localStorage.setItem(key, JSON.stringify(arr));
        }
      } catch (e) {
        // fallback: overwrite with new array if parsing fails
        localStorage.setItem(key, JSON.stringify([data]));
      }
      break;

    case "latestInvoice":
      localStorage.setItem(key, JSON.stringify(data));
      break;
  }
};

const loadData = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

const deleteData = (key, item) => {
  const data = localStorage.getItem(key);
  if (!data) return;

  if (key === "latestInvoice") {
    localStorage.removeItem(key);
    return;
  } else if (key === "sentInvoices") {
    let arr = [];
    try {
      arr = JSON.parse(data);
    } catch (e) {
      arr = [];
    }
    // Remove item by id or by value
    if (item) {
      arr = arr.filter((inv) => {
        if (typeof item === "object" && item.id) {
          return inv.id !== item.id;
        }
        return inv !== item;
      });
      localStorage.setItem("sentInvoices", JSON.stringify(arr));
    }
  }
};

export { storeData, loadData, deleteData };
