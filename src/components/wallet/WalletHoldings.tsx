import BitcoinIcon from "@/assets/svg/BitcoinIcon";
import EthereumIcon from "@/assets/svg/EthereumIcon";
import SolanaIcon from "@/assets/svg/SolanaIcon";
import WethIcon from "@/assets/svg/WethIcon";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
const holdings = [
  {
    icon: <EthereumIcon size="24" />,
    symbol: "ETH",
    name: "Ethereum",
    amount: "3.2134",
    value: "$5,124.64",
    change: "+5.12%",
    bgColor: "rgba(236, 239, 240, 0.1)",
  },
  {
    icon: <WethIcon size="24" />,
    symbol: "WETH",
    name: "Wrapped Ethereum",
    amount: "2.4563",
    value: "$3,912.54",
    change: "-2.34%",
    bgColor: "rgba(236, 239, 240, 0.1)",
  },
  {
    icon: <BitcoinIcon size="24" />,
    symbol: "BTC",
    name: "Bitcoin",
    amount: "0.5678",
    value: "$17,234.56",
    change: "+1.23%",
    bgColor: "rgba(247, 147, 26, 0.1)",
  },
  {
    icon: <SolanaIcon size="24" />,
    symbol: "SOL",
    name: "Solana",
    amount: "45.6789",
    value: "$1,234.56",
    change: "-0.45%",
    bgColor: "rgba(153, 69, 255, 0.1)",
  },
  {
    icon: <EthereumIcon size="24" />,
    symbol: "ETH",
    name: "NFTs",
    amount: "3.2134",
    value: "47",
    change: "+5.12%",
    bgColor: "rgba(236, 239, 240, 0.1)",
  },
];

const WalletHoldings = () => {
  const [timeRange, setTimeRange] = useState("all");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const generateData = useCallback(() => {
    const now = new Date();
    return Array.from({ length: 100 }, (_, i) => ({
      createdAt: new Date(
        now.getTime() - (100 - i) * 24 * 60 * 60 * 1000
      ).toISOString(), // 100 days of data
      value: Math.floor(Math.random() * 10000) + 1000,
    }));
  }, []);

  useEffect(() => {
    setChartData(generateData());
  }, [generateData]);

  const filteredData = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case "1d":
        return chartData.filter(
          (d) =>
            new Date(d.createdAt).getTime() >=
            now.getTime() - 24 * 60 * 60 * 1000
        );
      case "1w":
        return chartData.filter(
          (d) =>
            new Date(d.createdAt).getTime() >=
            now.getTime() - 7 * 24 * 60 * 60 * 1000
        );
      case "1m":
        return chartData.filter(
          (d) =>
            new Date(d.createdAt).getTime() >=
            now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
      case "1y":
        return chartData.filter(
          (d) =>
            new Date(d.createdAt).getTime() >=
            now.getTime() - 365 * 24 * 60 * 60 * 1000
        );
      default:
        return chartData;
    }
  }, [chartData, timeRange]);
  return (
    <div className="mt-7 flex flex-col lg:flex-row gap-7">
      <div className="holdings w-full lg:w-1/2 xl:w-2/5">
        <div className="border rounded-2xl py-5 px-2 sm:px-3 md:px-6 bg-[#1f2129] border-[#313442] h-full">
          <h2 className="text-[#7E7E8F] font-semibold mb-6">Holdings</h2>
          <div className="space-y-4">
            {holdings.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="p-2 rounded-full mr-3"
                    style={{ backgroundColor: item.bgColor }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-400">
                      {item.amount} {item.symbol}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{item.value}</p>
                  <p
                    className={`text-sm ${
                      item.change.startsWith("+")
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {item.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="holdings w-full lg:w-1/2 xl:w-3/5">
        <div className="border rounded-2xl py-5 px-2 sm:px-3 md:px-6 bg-[#1f2129] border-[#313442] h-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-[#7E7E8F] font-semibold mb-2 sm:mb-0">
              Portfolio Performance
            </h2>
            <div className="flex flex-wrap gap-2">
              {["1d", "1w", "1m", "1y", "all"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded text-sm ${
                    timeRange === range
                      ? "bg-[#7364DB] text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {range === "all" ? "All" : range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <XAxis
                  dataKey="createdAt"
                  tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
                  interval="preserveStartEnd"
                  tick={{ fill: "#9ca3af", fontSize: 14 }}
                />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 14 }} />
                <Tooltip
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                  formatter={(value) => [`$${value}`, "Value"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletHoldings;

interface ChartDataPoint {
  createdAt: string;
  value: number;
}

// #9ca3af
// text-14px
