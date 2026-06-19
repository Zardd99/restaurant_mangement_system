import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSocket } from "../../contexts/SocketContext";

interface TableSelectProps {
  value: number | null;
  onChange: (tableNumber: number | null) => void;
  orderType: "dine-in" | "takeaway" | "delivery";
  disabled?: boolean;
  maxTables?: number;
}

const TableSelect: React.FC<TableSelectProps> = ({
  value,
  onChange,
  orderType,
  disabled = false,
  maxTables = 50,
}) => {
  const [availableTables, setAvailableTables] = useState<number[]>([]);
  const [occupiedTables, setOccupiedTables] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTableGrid, setShowTableGrid] = useState(false);
  const { socket } = useSocket();

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const [availRes, occupiedRes] = await Promise.all([
        axios.get(`/api/tables/available?maxTables=${maxTables}`),
        axios.get(`/api/tables/occupied`),
      ]);

      const newOccupied: number[] = occupiedRes.data.occupiedTables;
      setAvailableTables(availRes.data.availableTables);
      setOccupiedTables(newOccupied);
      setError(null);

      // If the currently selected table was just taken, clear the selection.
      if (value !== null && newOccupied.includes(value)) {
        onChange(null);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to load table availability",
      );
      console.error("Error fetching tables:", err);
    } finally {
      setLoading(false);
    }
  }, [maxTables, value, onChange]);

  // Poll on mount and whenever the order type is dine-in.
  useEffect(() => {
    if (orderType !== "dine-in") return;

    fetchTables();
    const interval = setInterval(fetchTables, 10000);
    return () => clearInterval(interval);
  }, [orderType, fetchTables]);

  // Real-time refresh: whenever any order is created or its status changes,
  // re-fetch so occupied/available lists are current within milliseconds.
  useEffect(() => {
    if (!socket || orderType !== "dine-in") return;

    const refresh = () => fetchTables();
    socket.on("order_created", refresh);
    socket.on("order_updated", refresh);

    return () => {
      socket.off("order_created", refresh);
      socket.off("order_updated", refresh);
    };
  }, [socket, orderType, fetchTables]);

  if (orderType !== "dine-in") {
    return null;
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Table
      </label>

      {error && (
        <div className="p-2 bg-red-100 border border-red-400 text-red-700 text-sm rounded mb-2">
          {error}
        </div>
      )}

      {/* Current Selection Display */}
      <div className="p-3 bg-gray-50 border border-gray-300 rounded mb-2">
        {value ? (
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-800">
              Table {value} selected
            </span>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Change
            </button>
          </div>
        ) : (
          <span className="text-gray-500">No table selected</span>
        )}
      </div>

      {/* Stale-selection warning — shown when the selected table was taken */}
      {value !== null && occupiedTables.includes(value) && (
        <div className="p-2 bg-red-100 border border-red-400 text-red-700 text-sm rounded mb-2">
          Table {value} was just taken. Please select another table.
        </div>
      )}

      {/* Quick Select Buttons */}
      <div className="mb-2">
        <button
          type="button"
          onClick={() => setShowTableGrid(!showTableGrid)}
          disabled={loading || disabled}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 text-sm font-medium"
        >
          {loading
            ? "Loading..."
            : showTableGrid
              ? "Hide Table Grid"
              : "Show Table Grid"}
        </button>
      </div>

      {/* Table Grid */}
      {showTableGrid && (
        <div className="p-4 bg-white border border-gray-300 rounded mb-4">
          <div className="mb-3 flex gap-3 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-100 border border-green-400 rounded"></div>
              <span>Available ({availableTables.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-100 border border-red-400 rounded"></div>
              <span>Occupied ({occupiedTables.length})</span>
            </div>
          </div>

          <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
            {Array.from({ length: maxTables }, (_, i) => i + 1).map(
              (tableNum) => {
                const isAvailable = availableTables.includes(tableNum);
                const isSelected = value === tableNum;

                return (
                  <button
                    key={tableNum}
                    type="button"
                    onClick={() => {
                      if (isAvailable) {
                        onChange(isSelected ? null : tableNum);
                      }
                    }}
                    disabled={!isAvailable || disabled}
                    className={`
                      p-2 rounded border-2 font-medium transition text-sm
                      ${
                        isSelected
                          ? "bg-blue-500 text-white border-blue-600 ring-2 ring-blue-300"
                          : isAvailable
                            ? "bg-green-100 text-green-800 border-green-400 hover:bg-green-200 cursor-pointer"
                            : "bg-red-100 text-red-800 border-red-400 cursor-not-allowed opacity-50"
                      }
                    `}
                    title={
                      isAvailable ? "Click to select" : "Table is occupied"
                    }
                  >
                    {tableNum}
                  </button>
                );
              },
            )}
          </div>

          <div className="mt-3 text-xs text-gray-600">
            <button
              type="button"
              onClick={fetchTables}
              className="text-blue-500 hover:text-blue-700"
            >
              Refresh availability
            </button>
          </div>
        </div>
      )}

      {/* Direct Input */}
      <div className="mb-2">
        <label className="text-xs text-gray-600 mb-1 block">
          Or enter table number:
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            max={maxTables}
            value={value || ""}
            onChange={(e) => {
              const num = e.target.value ? parseInt(e.target.value) : null;
              if (num === null || (num >= 1 && num <= maxTables)) {
                if (num === null || availableTables.includes(num)) {
                  onChange(num);
                } else {
                  alert(`Table ${num} is currently occupied`);
                }
              }
            }}
            disabled={disabled}
            placeholder="Enter table #"
            className="flex-1 px-3 py-2 border border-gray-300 rounded disabled:bg-gray-100"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableSelect;
