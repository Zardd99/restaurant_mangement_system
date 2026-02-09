import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { useAuth } from "../../../../contexts/AuthContext";
import { promotionApi } from "../../../../services/promotionApi";

interface Promotion {
  _id: string;
  name: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  appliesTo: "all" | "category" | "menuItem";
  targetIds: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  minimumOrderAmount: number;
  maxUsagePerCustomer?: number;
  usageCount: number;
}

const PromotionManagement: React.FC = () => {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 0,
    appliesTo: "all" as "all" | "category" | "menuItem",
    targetIds: [] as string[],
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    isActive: true,
    minimumOrderAmount: 0,
    maxUsagePerCustomer: undefined as number | undefined,
  });

  useEffect(() => {
    if (user?.role === "admin") {
      fetchPromotions();
    }
  }, [user]);

  const fetchPromotions = async () => {
    try {
      const response = await promotionApi.getAll();
      setPromotions(response.data);
    } catch (error) {
      console.error("Error fetching promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (promotion?: Promotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        name: promotion.name,
        description: promotion.description,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        appliesTo: promotion.appliesTo,
        targetIds: promotion.targetIds,
        startDate: promotion.startDate.split("T")[0],
        endDate: promotion.endDate.split("T")[0],
        isActive: promotion.isActive,
        minimumOrderAmount: promotion.minimumOrderAmount,
        maxUsagePerCustomer: promotion.maxUsagePerCustomer,
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        name: "",
        description: "",
        discountType: "percentage",
        discountValue: 0,
        appliesTo: "all",
        targetIds: [],
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        isActive: true,
        minimumOrderAmount: 0,
        maxUsagePerCustomer: undefined,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPromotion(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingPromotion) {
        await promotionApi.update(editingPromotion._id, formData);
      } else {
        await promotionApi.create(formData);
      }
      fetchPromotions();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving promotion:", error);
      alert("Error saving promotion. Please check the form data.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this promotion?")) {
      try {
        await promotionApi.delete(id);
        fetchPromotions();
      } catch (error) {
        console.error("Error deleting promotion:", error);
        alert("Error deleting promotion.");
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDiscountText = (promotion: Promotion) => {
    if (promotion.discountType === "percentage") {
      return `${promotion.discountValue}% OFF`;
    } else {
      return `$${promotion.discountValue} OFF`;
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <Box p={3}>
        <Typography variant="h6" color="error">
          Access denied. Admin privileges required.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading promotions...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Promotion Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add New Promotion
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Discount</TableCell>
              <TableCell>Applies To</TableCell>
              <TableCell>Active Period</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Usage</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {promotions.map((promotion) => (
              <TableRow key={promotion._id}>
                <TableCell>
                  <Typography variant="subtitle2">{promotion.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {promotion.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getDiscountText(promotion)}
                    color="primary"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={promotion.appliesTo}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(promotion.startDate)} -{" "}
                    {formatDate(promotion.endDate)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={promotion.isActive ? "Active" : "Inactive"}
                    color={promotion.isActive ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    Used {promotion.usageCount} times
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(promotion)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(promotion._id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingPromotion ? "Edit Promotion" : "Create New Promotion"}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={2}>
            <TextField
              label="Promotion Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
            />
            <Box display="flex" gap={2}>
              <TextField
                select
                label="Discount Type"
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountType: e.target.value as "percentage" | "fixed",
                  })
                }
                fullWidth
              >
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="fixed">Fixed Amount</MenuItem>
              </TextField>
              <TextField
                label="Discount Value"
                type="number"
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountValue: parseFloat(e.target.value),
                  })
                }
                fullWidth
                inputProps={{
                  min: 0,
                  max: formData.discountType === "percentage" ? 100 : undefined,
                }}
                helperText={
                  formData.discountType === "percentage"
                    ? "Enter percentage (0-100)"
                    : "Enter fixed amount"
                }
              />
            </Box>
            <TextField
              select
              label="Applies To"
              value={formData.appliesTo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  appliesTo: e.target.value as "all" | "category" | "menuItem",
                })
              }
              fullWidth
            >
              <MenuItem value="all">All Items</MenuItem>
              <MenuItem value="category">Specific Categories</MenuItem>
              <MenuItem value="menuItem">Specific Menu Items</MenuItem>
            </TextField>
            <Box display="flex" gap={2}>
              <TextField
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <TextField
              label="Minimum Order Amount"
              type="number"
              value={formData.minimumOrderAmount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minimumOrderAmount: parseFloat(e.target.value),
                })
              }
              fullWidth
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Max Usage Per Customer (Optional)"
              type="number"
              value={formData.maxUsagePerCustomer || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxUsagePerCustomer: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              fullWidth
              inputProps={{ min: 1 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingPromotion ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromotionManagement;
