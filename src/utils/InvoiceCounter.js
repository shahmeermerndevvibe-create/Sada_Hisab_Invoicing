import { getLatestDocumentCounter } from "../actions/invoiceActions"

export const loadNextDocumentNumber = async (type) => {
  const latestCounter = await getLatestDocumentCounter(type);

  if (latestCounter === 0) {
    return {
      documentCounter: 1001,
      documentNumber: "1001",
    };
  }

  return {
    documentCounter: latestCounter + 1,
    documentNumber: String(latestCounter + 1),
  };
};