import React from "react";
import Accordion from "@/components/common/Accordion";

interface BidInfo {
  collectionSlug: string;
  basePrice: string;
  formattedPrice: string;
  expirationDate: string;
  paymentToken: {
    symbol: string;
    usdPrice: string;
  };
  makerAddress: string;
  quantity: number;
  marketplace: string;
  eventTimestamp: string;
}

interface RecentBidsProps {
  bids: BidInfo[];
  currentPage: number;
  recordsPerPage: number;
  totalPages: number;
  setRecordsPerPage: (value: number) => void;
  paginate: (pageNumber: number) => void;
  renderPageNumbers: () => React.ReactNode;
}

const RecentBids: React.FC<RecentBidsProps> = ({
  bids,
  currentPage,
  recordsPerPage,
  totalPages,
  setRecordsPerPage,
  paginate,
  renderPageNumbers,
}) => {
  const getOpenSeaProfileUrl = (address: string) => {
    return `https://opensea.io/${address}`;
  };

  const getOpenSeaCollectionUrl = (slug: string) => {
    return `https://opensea.io/collection/${slug}/activity?search[eventTypes][0]=COLLECTION_OFFER`;
  };

  return (
    <Accordion title={`Recent Bids (${bids.length})`}>
      <div className="border rounded-2xl py-3 sm:py-5 px-2 sm:px-6 bg-[#1f2129] border-[#313442] h-full overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[#313442]">
              <th scope="col" className="px-6 py-3 text-center">
                Collection
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                Expiration
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                Maker
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                Quantity
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                Marketplace
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody>
            {bids.map((bid, index) => (
              <tr key={index} className="border-b border-[#313442]">
                <td className="px-6 py-4 text-center">
                  <a
                    href={getOpenSeaCollectionUrl(bid.collectionSlug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7364DB] underline"
                  >
                    {bid.collectionSlug}
                  </a>
                </td>
                <td className="px-6 py-4 text-center">{`${bid.formattedPrice} ${bid.paymentToken.symbol}`}</td>
                <td className="px-6 py-4 text-center">
                  {new Date(bid.expirationDate).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <a
                    href={getOpenSeaProfileUrl(bid.makerAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7364DB] underline"
                  >
                    {`${bid.makerAddress.slice(
                      0,
                      6
                    )}...${bid.makerAddress.slice(-4)}`}
                  </a>
                </td>
                <td className="px-6 py-4 text-center">{bid.quantity}</td>
                <td className="px-6 py-4 text-center">{bid.marketplace}</td>
                <td className="px-6 py-4 text-center">
                  {new Date(bid.eventTimestamp).toLocaleString()}
                </td>
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
          <div className="hidden sm:flex space-x-2">{renderPageNumbers()}</div>
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
    </Accordion>
  );
};

export default RecentBids;
