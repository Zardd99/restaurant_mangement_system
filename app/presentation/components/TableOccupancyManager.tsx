import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSocket } from "../../contexts/SocketContext";

interface TableStatus {
  tableNumber: number;
  status: "occupied" | "available";
  orderId?: string;
  orderStatus?: string;
  customerName?: string;
  itemCount?: number;
  totalAmount?: number;
  createdAt?: string;
}

interface TableOccupancySummary {
  totalTables: number;
  occupiedCount: number;
  availableCount: number;
  occupiedTables: number[];
  availableTables: number[];
  occupancyRate: number;
}

const TableOccupancyManager: React.FC<{ maxTables?: number }> = ({
  maxTables = 50,
}) => {
  const [tableStatus, setTableStatus] = useState<TableStatus[]>([]);
  const [occupancySummary, setOccupancySummary] =
    useState<TableOccupancySummary | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const { socket } = useSocket();

  const fetchTableStatus = useCallback(async () => {
    try {
      setLoading(true);
      const [statusRes, summaryRes] = await Promise.all([
        axios.get(`/api/tables/status?maxTables=${maxTables}`),
        axios.get(`/api/tables/occupancy-summary?maxTables=${maxTables}`),
      ]);

      setTableStatus(statusRes.data.data);
      setOccupancySummary(summaryRes.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch table status");
      console.error("Error fetching table status:", err);
    } finally {
      setLoading(false);
    }
  }, [maxTables]);

  // Polling fallback
  useEffect(() => {
    fetchTableStatus();

    if (autoRefresh) {
      const interval = setInterval(fetchTableStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchTableStatus, autoRefresh, refreshInterval]);

  // Real-time refresh via Socket.io — updates arrive within milliseconds of
  // any order being created or its status changing.
  useEffect(() => {
    if (!socket) return;

    const refresh = () => fetchTableStatus();
    socket.on("order_created", refresh);
    socket.on("order_updated", refresh);

    return () => {
      socket.off("order_created", refresh);
      socket.off("order_updated", refresh);
    };
  }, [socket, fetchTableStatus]);

  // Keep the selectedTable details in sync after each refresh.
  useEffect(() => {
    if (!selectedTable) return;
    const updated = tableStatus.find(
      (t) => t.tableNumber === selectedTable.tableNumber,
    );
    if (updated) setSelectedTable(updated);
  }, [tableStatus]);

  const releaseTable = async (tableNumber: number) => {
    setReleaseError(null);
    try {
      await axios.post(`/api/tables/${tableNumber}/release`);
      await fetchTableStatus();
      setSelectedTable(null);
    } catch (err: any) {
      setReleaseError(
        err.response?.data?.message || `Failed to release table ${tableNumber}`,
      );
    }
  };

  const getTableColor = (status: "occupied" | "available"): string => {
    return status === "occupied"
      ? "bg-red-100 border-red-400"
      : "bg-green-100 border-green-400";
  };

  const getStatusBadgeColor = (orderStatus?: string): string => {
    switch (orderStatus) {
      case "pending":
        return "bg-yellow-200 text-yellow-800";
      case "confirmed":
        return "bg-blue-200 text-blue-800";
      case "preparing":
        return "bg-orange-200 text-orange-800";
      case "ready":
        return "bg-green-200 text-green-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  if (loading && tableStatus.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600">Loading table status...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          Table Management
        </h1>

        {/* Controls */}
        <div className="flex gap-4 mb-4 flex-wrap">
          <button
            onClick={fetchTableStatus}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-gray-700">Auto-refresh</span>
          </label>

          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded"
            >
              <option value={3000}>3s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          )}

          {socket?.connected && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
              Live
            </span>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
            {error}
          </div>
        )}

        {/* Occupancy Summary */}
        {occupancySummary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <div className="text-gray-600 text-sm">Total Tables</div>
              <div className="text-2xl font-bold text-blue-600">
                {occupancySummary.totalTables}
              </div>
            </div>

            <div className="p-3 bg-red-50 rounded border border-red-200">
              <div className="text-gray-600 text-sm">Occupied</div>
              <div className="text-2xl font-bold text-red-600">
                {occupancySummary.occupiedCount}
              </div>
            </div>

            <div className="p-3 bg-green-50 rounded border border-green-200">
              <div className="text-gray-600 text-sm">Available</div>
              <div className="text-2xl font-bold text-green-600">
                {occupancySummary.availableCount}
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded border border-purple-200">
              <div className="text-gray-600 text-sm">Occupancy Rate</div>
              <div className="text-2xl font-bold text-purple-600">
                {occupancySummary.occupancyRate}%
              </div>
            </div>

            <div className="p-3 bg-indigo-50 rounded border border-indigo-200">
              <div className="text-gray-600 text-sm">Status</div>
              <div className="text-lg font-bold text-indigo-600">
                {occupancySummary.occupancyRate < 50
                  ? "🟢 Good"
                  : occupancySummary.occupancyRate < 75
                    ? "🟡 Busy"
                    : "🔴 Full"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Table Floor Plan
        </h2>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {tableStatus.map((table) => (
            <button
              key={table.tableNumber}
              onClick={() => setSelectedTable(table)}
              className={`
                p-4 rounded border-2 cursor-pointer transition transform hover:scale-105
                ${getTableColor(table.status)}
                ${selectedTable?.tableNumber === table.tableNumber ? "ring-4 ring-blue-500" : ""}
              `}
              title={
                table.status === "occupied"
                  ? `${table.customerName || "Customer"} - ${table.orderStatus}`
                  : "Available"
              }
            >
              <div className="font-bold text-lg text-gray-800">
                T{table.tableNumber}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {table.status === "occupied" ? "🔴" : "🟢"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Table Details */}
      {selectedTable && (
        <div className="p-4 bg-gray-50 rounded border border-gray-300">
          <h3 className="text-xl font-bold mb-3 text-gray-800">
            Table {selectedTable.tableNumber} Details
          </h3>

          {releaseError && (
            <div className="p-2 bg-red-100 border border-red-400 text-red-700 text-sm rounded mb-3">
              {releaseError}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div
                className={`inline-block px-3 py-1 rounded text-sm font-medium ${getStatusBadgeColor(
                  selectedTable.orderStatus,
                )}`}
              >
                {selectedTable.status === "occupied"
                  ? selectedTable.orderStatus || "Unknown"
                  : "Available"}
              </div>
            </div>

            {selectedTable.customerName && (
              <div>
                <div className="text-sm text-gray-600">Customer</div>
                <div className="font-medium text-gray-800">
                  {selectedTable.customerName}
                </div>
              </div>
            )}

            {selectedTable.itemCount !== undefined && (
              <div>
                <div className="text-sm text-gray-600">Items</div>
                <div className="font-medium text-gray-800">
                  {selectedTable.itemCount} items
                </div>
              </div>
            )}

            {selectedTable.totalAmount !== undefined && (
              <div>
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="font-medium text-gray-800">
                  ${selectedTable.totalAmount.toFixed(2)}
                </div>
              </div>
            )}

            {selectedTable.createdAt && (
              <div>
                <div className="text-sm text-gray-600">Order Time</div>
                <div className="font-medium text-gray-800">
                  {new Date(selectedTable.createdAt).toLocaleTimeString()}
                </div>
              </div>
            )}

            {selectedTable.orderId && (
              <div>
                <div className="text-sm text-gray-600">Order ID</div>
                <div className="font-mono text-xs text-gray-600">
                  {selectedTable.orderId.slice(0, 8)}...
                </div>
              </div>
            )}
          </div>

          {selectedTable.status === "occupied" && (
            <div className="flex gap-3">
              <button
                onClick={() => releaseTable(selectedTable.tableNumber)}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Release Table
              </button>

              <button
                onClick={() => {
                  if (selectedTable.orderId) {
                    window.location.href = `/orders/${selectedTable.orderId}`;
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                View Order Details
              </button>
            </div>
          )}

          <button
            onClick={() => setSelectedTable(null)}
            className="mt-3 w-full px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Close Details
          </button>
        </div>
      )}

      {/* Occupied Tables List */}
      {occupancySummary && occupancySummary.occupiedCount > 0 && (
        <div className="mt-6 p-4 bg-red-50 rounded border border-red-200">
          <h3 className="text-lg font-bold mb-3 text-red-800">
            Currently Occupied Tables
          </h3>
          <div className="flex flex-wrap gap-2">
            {occupancySummary.occupiedTables.map((tableNum) => (
              <span
                key={tableNum}
                className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm font-medium cursor-pointer hover:bg-red-300"
                onClick={() => {
                  const table = tableStatus.find(
                    (t) => t.tableNumber === tableNum,
                  );
                  if (table) setSelectedTable(table);
                }}
              >
                Table {tableNum}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableOccupancyManager;
