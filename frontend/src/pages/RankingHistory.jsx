import React, { useEffect, useState } from "react";
import { Spinner, Alert } from "react-bootstrap";
import { Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const RankingHistory = ({ selectedCategory, entries }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Custom season order in Greek
  const seasonOrder = ["Φεβρουάριος", "Ιούνιος"];

  useEffect(() => {
    const filtered = entries.filter(
      (entry) => entry.fields === selectedCategory
    );
    if (filtered.length > 0) {
      setHistory(filtered);
    } else {
      setError(
        "Δεν βρέθηκαν δεδομένα ιστορικού για την επιλεγμένη ειδικότητα."
      );
    }
    setLoading(false);
  }, [selectedCategory, entries]);

  // Chart: oldest to newest (Φεβρουάριος -> Ιούνιος by year)
  const chartData = [...history]
    .sort(
      (a, b) =>
        a.year - b.year ||
        seasonOrder.indexOf(a.season) - seasonOrder.indexOf(b.season)
    )
    .map((entry) => ({
      name: `${entry.season} ${entry.year}`,
      ranking: parseInt(entry.ranking),
    }));

  // Table: newest first (Ιούνιος -> Φεβρουάριος by year)
  const tableRows = [...history]
    .sort(
      (a, b) =>
        b.year - a.year ||
        seasonOrder.indexOf(b.season) - seasonOrder.indexOf(a.season)
    )
    .map((entry, index) => ({
      id: index + 1,
      Year: entry.year,
      Season: entry.season,
      Ranking: entry.ranking,
      Type: entry.type,
      Fields: entry.fields,
    }));

  const columns = [
    { field: "Year", headerName: "Έτος", flex: 1 },
    { field: "Season", headerName: "Περίοδος", flex: 1 },
    { field: "Ranking", headerName: "Κατάταξη", flex: 1, type: "number" },
    { field: "Type", headerName: "Τύπος", flex: 1 },
    { field: "Fields", headerName: "Πεδίο/Πεδία", flex: 1 },
  ];

  return (
    <div className="mt-5">
      <div className="mb-4">
        <h5 className="mb-3" style={{ fontWeight: 600 }}>
          Ιστορικό Θέσεων Κατάταξης
        </h5>

        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        )}

        {!loading && error && <Alert variant="danger">{error}</Alert>}

        {!loading && !error && history.length > 0 && (
          <>
            {/* Chart */}
            <Typography variant="subtitle2" className="mb-2 text-muted">
              Εξέλιξη θέσης στον χρόνο
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis reversed allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="ranking"
                  stroke="#007bff"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Table */}
            <Typography variant="subtitle2" className="mt-4 mb-2 text-muted">
              Πίνακας ιστορικού
            </Typography>
            <div style={{ width: "100%" }}>
              <DataGrid
                rows={tableRows}
                columns={columns}
                autoHeight
                disableRowSelectionOnClick
                pageSizeOptions={[5, 10, 20]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 5, page: 0 } },
                }}
                sx={{
                  border: 0,
                  "& .MuiDataGrid-cell": {
                    justifyContent: "start",
                    textAlign: "left",
                  },
                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontWeight: "bold",
                  },
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RankingHistory;
