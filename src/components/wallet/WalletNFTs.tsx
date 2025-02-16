import React, { useState } from "react";

// Mock data generation for NFTs
const generateNFTMockData = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `NFT ${index + 1}`,
    collection: `Collection ${Math.floor(index / 10) + 1}`,
    floorPrice: (Math.random() * 10).toFixed(3),
    lastPrice: (Math.random() * 15).toFixed(3),
    listed: Math.random() > 0.5,
  }));
};

const nftMockData = generateNFTMockData(100);

interface NFTRecord {
  id: number;
  name: string;
  collection: string;
  floorPrice: string;
  lastPrice: string;
  listed: boolean;
}

const WalletNFTs = () => {
  const [activeTab, setActiveTab] = useState("listed");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(20);

  const filteredNFTs =
    activeTab === "listed"
      ? nftMockData.filter((nft) => nft.listed)
      : nftMockData.filter((nft) => !nft.listed);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredNFTs.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );

  const totalRecords = filteredNFTs.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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

  return (
    <div className="nft-assets mt-7">
      <div className="holdings flex-1">
        <div className="border rounded-2xl py-5 px-3 sm:px-6 bg-[#1f2129] border-[#313442] h-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <h2 className="text-[#7E7E8F] font-semibold">NFT Assets</h2>
            <div className="flex space-x-2 w-full sm:w-auto">
              <button
                className={`flex-1 sm:flex-none px-4 py-2 rounded ${
                  activeTab === "listed"
                    ? "bg-[#7364DB] text-white"
                    : "bg-transparent text-white"
                }`}
                onClick={() => setActiveTab("listed")}
              >
                Listed
              </button>
              <button
                className={`flex-1 sm:flex-none px-4 py-2 rounded ${
                  activeTab === "unlisted"
                    ? "bg-[#7364DB] text-white"
                    : "bg-transparent text-white"
                }`}
                onClick={() => setActiveTab("unlisted")}
              >
                Unlisted
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Collection
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Floor Price
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Last Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((nft: NFTRecord) => (
                  <tr key={nft.id} className="border-b border-[#313442]">
                    <td className="px-6 py-4">{nft.name}</td>
                    <td className="px-6 py-4">{nft.collection}</td>
                    <td className="px-6 py-4">{nft.floorPrice} ETH</td>
                    <td className="px-6 py-4">{nft.lastPrice} ETH</td>
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

export default WalletNFTs;
