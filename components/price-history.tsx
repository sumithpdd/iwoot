"use client"

import { useCallback, useState } from "react"
import { PriceHistory } from "@/lib/types/product"
import { ProductService } from "@/lib/services/product.service"
import { CopyToClipboardButton } from "@/components/copy-to-clipboard-button"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, TrendingDown, TrendingUp, Minus, ExternalLink } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface PriceHistoryProps {
  productId: string
  priceHistory: PriceHistory[]
  currentPrice?: number
  originalPrice: number
  website: string
  onPriceHistoryAdded?: () => void
}

export default function PriceHistoryComponent({
  productId,
  priceHistory,
  currentPrice,
  originalPrice,
  website,
  onPriceHistoryAdded,
}: PriceHistoryProps) {
  const { toast } = useToast()
  const { user } = useAuth()

  const getToken = useCallback(
    () => user?.getIdToken() ?? Promise.resolve(null),
    [user]
  )
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPrice, setNewPrice] = useState("")
  const [newWebsite, setNewWebsite] = useState(website)
  const [newNotes, setNewNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sort price history by date (newest first)
  const sortedHistory = [...priceHistory].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  // Prepare chart data - include original price as first entry if no history
  const chartData = sortedHistory.length > 0
    ? [
        { date: format(parseISO(sortedHistory[sortedHistory.length - 1].date), "MMM dd"), price: sortedHistory[sortedHistory.length - 1].price },
        ...sortedHistory.map((entry) => ({
          date: format(parseISO(entry.date), "MMM dd"),
          price: entry.price,
        })),
      ].reverse()
    : []

  // Calculate price changes
  const getPriceChange = (index: number) => {
    if (index === 0) return null
    const current = sortedHistory[index].price
    const previous = sortedHistory[index - 1].price
    const change = current - previous
    const percentChange = ((change / previous) * 100).toFixed(1)
    return { change, percentChange }
  }

  const handleAddPrice = async () => {
    if (!newPrice || isNaN(parseFloat(newPrice)) || parseFloat(newPrice) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await ProductService.addPriceHistory(
        getToken,
        productId,
        parseFloat(newPrice),
        new Date().toISOString(),
        newWebsite || website,
        newNotes || undefined
      )
      toast({
        title: "Success",
        description: "Price history entry added successfully",
      })
      setNewPrice("")
      setNewWebsite(website)
      setNewNotes("")
      setShowAddForm(false)
      if (onPriceHistoryAdded) {
        onPriceHistoryAdded()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add price history",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (priceHistory.length === 0 && !showAddForm) {
    return (
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Price History
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                Track price changes over time
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Price
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No price history yet. Add your first price entry!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Price History
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
              {priceHistory.length} {priceHistory.length === 1 ? "entry" : "entries"}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Price
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Price Form */}
        {showAddForm && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPrice" className="text-sm font-medium">
                  Price (£) *
                </Label>
                <div className="flex gap-1 items-center">
                  <Input
                    id="newPrice"
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g., 299.99"
                    className="h-10 min-w-0 flex-1"
                  />
                  <CopyToClipboardButton value={newPrice} label="Price" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newWebsite" className="text-sm font-medium">
                  Website
                </Label>
                <div className="flex gap-1 items-center">
                  <Input
                    id="newWebsite"
                    type="url"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    placeholder="https://..."
                    className="h-10 min-w-0 flex-1"
                  />
                  <CopyToClipboardButton value={newWebsite} label="Website" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newNotes" className="text-sm font-medium">
                  Notes (Optional)
                </Label>
                <div className="flex gap-1 items-center">
                  <Input
                    id="newNotes"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="e.g., Black Friday sale"
                    className="h-10 min-w-0 flex-1"
                  />
                  <CopyToClipboardButton value={newNotes} label="Notes" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddPrice}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? "Adding..." : "Add Price Entry"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setNewPrice("")
                  setNewWebsite(website)
                  setNewNotes("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Price Chart */}
        {chartData.length > 0 && (
          <div className="w-full h-64 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Price Trend
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                  tickFormatter={(value) => `£${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                  }}
                  formatter={(value: number | undefined) => {
                    if (value === undefined) return ["", "Price"]
                    return [`£${value.toFixed(2)}`, "Price"]
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Price History Table */}
        <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                <TableHead className="w-32">Date</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Website</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHistory.map((entry, index) => {
                const priceChange = getPriceChange(index)
                const isIncrease = priceChange && priceChange.change > 0
                const isDecrease = priceChange && priceChange.change < 0

                return (
                  <TableRow
                    key={`${entry.date}-${entry.price}-${index}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      {format(parseISO(entry.date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        £{entry.price.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {priceChange ? (
                        <div className="flex items-center gap-1">
                          {isIncrease ? (
                            <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
                          ) : isDecrease ? (
                            <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <Minus className="h-4 w-4 text-gray-400" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              isIncrease
                                ? "text-red-600 dark:text-red-400"
                                : isDecrease
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {isIncrease ? "+" : ""}
                            £{Math.abs(priceChange.change).toFixed(2)} (
                            {isIncrease ? "+" : ""}
                            {priceChange.percentChange}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                          {(() => {
                            try {
                              return new URL(entry.website).hostname.replace("www.", "")
                            } catch {
                              return entry.website.length > 30 ? entry.website.substring(0, 30) + "..." : entry.website
                            }
                          })()}
                        </span>
                        <a
                          href={entry.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.notes && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                          {entry.notes}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        {sortedHistory.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lowest Price</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                £{Math.min(...sortedHistory.map((e) => e.price)).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Highest Price</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                £{Math.max(...sortedHistory.map((e) => e.price)).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Average Price</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                £{(
                  sortedHistory.reduce((sum, e) => sum + e.price, 0) / sortedHistory.length
                ).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current vs Original</p>
              <p
                className={`text-lg font-bold ${
                  currentPrice && currentPrice < originalPrice
                    ? "text-green-600 dark:text-green-400"
                    : currentPrice && currentPrice > originalPrice
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {currentPrice
                  ? `${((currentPrice / originalPrice - 1) * 100).toFixed(1)}%`
                  : "-"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

