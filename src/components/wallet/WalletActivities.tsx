import React, { useState } from "react";

// Mock data generation
const generateMockData = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    item: `Item ${index + 1}`,
    entryPrice: (Math.random() * 10).toFixed(3),
    exitPrice: (Math.random() * 15).toFixed(3),
    txFees: (Math.random() * 0.1).toFixed(3),
    profit: (Math.random() * 5 - 2.5).toFixed(3),
    status: Math.random() > 0.5 ? "Completed" : "Pending",
    txLink: `https://example.com/tx/${index + 1}`,
    hide: Math.random() > 0.5,
    holdDuration: `${Math.floor(Math.random() * 30)}d ${Math.floor(
      Math.random() * 24
    )}h`,
  }));
};

const mockData = generateMockData(100);

// Mock data generation for activities
const generateActivityMockData = (count: number) => {
  const events = ["Buy", "Sell", "Transfer", "Mint", "Burn"];
  const currencies = ["ETH", "USDC", "WETH"];
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    event: events[Math.floor(Math.random() * events.length)],
    item: `Item ${index + 1}`,
    price: (Math.random() * 10).toFixed(3),
    currency: currencies[Math.floor(Math.random() * currencies.length)],
    quantity: Math.floor(Math.random() * 5) + 1,
    from: `0x${Math.random().toString(16).substr(2, 8)}`,
    to: `0x${Math.random().toString(16).substr(2, 8)}`,
    txLink: `https://example.com/tx/${index + 1}`,
    time: new Date(
      Date.now() - Math.floor(Math.random() * 10000000000)
    ).toISOString(),
  }));
};

const activityMockData = generateActivityMockData(100);

interface ActivityRecord {
  id: number;
  event: string;
  item: string;
  price: string;
  currency: string;
  quantity: number;
  from: string;
  to: string;
  txLink: string;
  time: string;
}

interface FlipRecord {
  id: number;
  item: string;
  entryPrice: string;
  exitPrice: string;
  txFees: string;
  profit: string;
  status: string;
  txLink: string;
  hide: boolean;
  holdDuration: string;
}

type Record = ActivityRecord | FlipRecord;

const WalletActivities = () => {
  const [activeTab, setActiveTab] = useState("activity");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(20);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords =
    activeTab === "activity"
      ? (activityMockData.slice(
          indexOfFirstRecord,
          indexOfLastRecord
        ) as ActivityRecord[])
      : (mockData.slice(indexOfFirstRecord, indexOfLastRecord) as FlipRecord[]);

  const totalRecords =
    activeTab === "activity" ? activityMockData.length : mockData.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => paginate(i)}
          className={`px-3 py-1 rounded ${
            currentPage === i
              ? "bg-[#7364DB] text-white"
              : "bg-gray-700 text-white"
          }`}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="activity mt-7">
      <div className="holdings flex-1">
        <div className="border rounded-2xl py-5 px-3 sm:px-6 bg-[#1f2129] border-[#313442] h-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <h2 className="text-[#7E7E8F] font-semibold capitalize">
              {activeTab}
            </h2>
            <div className="flex space-x-2 w-full sm:w-auto">
              <button
                className={`flex-1 sm:flex-none px-4 py-2 rounded ${
                  activeTab === "flips"
                    ? "bg-[#7364DB] text-white"
                    : "bg-transparent text-white"
                }`}
                onClick={() => setActiveTab("flips")}
              >
                Flips
              </button>
              <button
                className={`flex-1 sm:flex-none px-4 py-2 rounded ${
                  activeTab === "activity"
                    ? "bg-[#7364DB] text-white"
                    : "bg-transparent text-white"
                }`}
                onClick={() => setActiveTab("activity")}
              >
                Activity
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase">
                <tr>
                  {activeTab === "activity" ? (
                    <>
                      <th scope="col" className="px-6 py-3">
                        Event
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Item
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Currency
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3">
                        From
                      </th>
                      <th scope="col" className="px-6 py-3">
                        To
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Time
                      </th>
                    </>
                  ) : (
                    <>
                      <th scope="col" className="px-6 py-3">
                        Item
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Entry Price
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Exit Price
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Tx Fees
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Profit (in Ξ)
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Hide
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Hold Duration
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((record: Record) => (
                  <tr key={record.id} className="border-b border-[#313442]">
                    {activeTab === "activity" ? (
                      <>
                        <td className="px-6 py-4">
                          {(record as ActivityRecord).event}
                        </td>
                        <td className="px-6 py-4">{record.item}</td>
                        <td className="px-6 py-4">
                          {(record as ActivityRecord).price}
                        </td>
                        <td className="px-6 py-4">
                          {(record as ActivityRecord).currency}
                        </td>
                        <td className="px-6 py-4">
                          {(record as ActivityRecord).quantity}
                        </td>
                        <td className="px-6 py-4">
                          {(record as ActivityRecord).from}
                        </td>
                        <td className="px-6 py-4">
                          {(record as ActivityRecord).to}
                        </td>

                        <td className="px-6 py-4">
                          {new Date(
                            (record as ActivityRecord).time
                          ).toLocaleString()}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">{record.item}</td>
                        <td className="px-6 py-4">
                          {(record as FlipRecord).entryPrice}
                        </td>
                        <td className="px-6 py-4">
                          {(record as FlipRecord).exitPrice}
                        </td>
                        <td className="px-6 py-4">
                          {(record as FlipRecord).txFees}
                        </td>
                        <td className="px-6 py-4">
                          {(record as FlipRecord).profit}
                        </td>
                        <td className="px-6 py-4">
                          {(record as FlipRecord).status}
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={(record as FlipRecord).hide}
                            readOnly
                          />
                        </td>
                        <td className="px-6 py-4">
                          {(record as FlipRecord).holdDuration}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Show</span>
              <select
                value={recordsPerPage}
                onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                className="bg-gray-700 text-white rounded px-2 py-1"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-400">Records</span>
            </div>
            <div className="flex flex-wrap justify-center space-x-2">
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
              >
                First
              </button>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
              >
                Prev
              </button>
              <div className="hidden sm:flex space-x-2">
                {renderPageNumbers()}
              </div>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </div>
          <div className="sm:hidden mt-4 text-center">
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletActivities;
